import pandas as pd
import numpy as np
import pickle
import os
import json
import platform
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from codecarbon import EmissionsTracker


# =====================================================
# FILE LOADER
# =====================================================
def load_any_file(file_path):

    if file_path.endswith(".csv"):
        return "dataframe", pd.read_csv(file_path)

    elif file_path.endswith(".pkl"):
        try:
            with open(file_path, "rb") as f:
                obj = pickle.load(f)
        except ModuleNotFoundError as e:
            print(f"\n❌ Missing dependency: {e.name}")
            print(f"Install using: pip install {e.name}")
            return "missing_dependency", None

        if isinstance(obj, pd.DataFrame):
            return "dataframe", obj

        elif hasattr(obj, "predict"):
            return "model", obj

        else:
            return "unknown", obj

    else:
        raise ValueError("Unsupported file type")


# =====================================================
# SYSTEM INFO
# =====================================================
def get_system_info():
    return {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "cpu_count": os.cpu_count()
    }


# =====================================================
# FEATURE COUNT DETECTION
# =====================================================
def detect_feature_count(model):

    n_features = None

    if hasattr(model, "n_features_in_"):
        n_features = model.n_features_in_

    elif hasattr(model, "feature_count_"):
        n_features = model.feature_count_

    elif hasattr(model, "get_feature_importance"):
        try:
            n_features = len(model.get_feature_importance())
        except:
            n_features = None

    if not n_features or n_features <= 0:
        print("⚠ Feature count unknown. Using safe default = 10")
        n_features = 10

    return int(n_features)


# =====================================================
# RECOMMENDATIONS ENGINE
# =====================================================
def generate_recommendations(results):

    recs = []

    energy = results.get("energy_kwh", 0)
    carbon = results.get("carbon_kg", 0)
    samples = results.get("num_samples", 0)
    features = results.get("num_features", 0)
    model = results.get("model", "")
    epochs = results.get("epochs", 1)
    per_epoch = results.get("energy_per_epoch", [])
    system = results.get("system_info", {})

    cpu = system.get("cpu_count", 0)

    if energy < 0.01:
        recs.append("Energy consumption is very low — configuration is efficient.")
    elif energy < 0.1:
        recs.append("Moderate energy usage — early stopping can reduce cost.")
    else:
        recs.append("High energy usage — reduce model complexity or dataset size.")

    if carbon > 0.5:
        recs.append("High carbon footprint — use renewable-powered infrastructure.")

    if epochs > 10:
        recs.append("High epoch count — consider early stopping.")

    if len(per_epoch) > 2 and per_epoch[-1] >= per_epoch[-2]:
        recs.append("Energy plateau detected — early stopping recommended.")

    if samples > 200000:
        recs.append("Large dataset — apply sampling or distributed training.")

    if features > 1000:
        recs.append("High feature dimensionality — apply PCA or feature selection.")

    if model == "RandomForest":
        recs.append("Reduce number of trees or tree depth to reduce energy.")

    if cpu and cpu >= 16:
        recs.append("Parallel training recommended for efficiency.")

    recs.append("Use pruning, quantization, and mixed precision to reduce compute.")
    recs.append("Schedule training during low-carbon electricity hours.")

    return recs


# =====================================================
# SAVE RESULTS (JSON ONLY)
# =====================================================
def save_results(results, recommendations):

    os.makedirs("results", exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = f"results/audit_{ts}.json"

    structured_payload = {
        "experiment": {
            "type": results.get("file_type"),
            "epochs": results.get("epochs"),
            "timestamp": ts
        },
        "metrics": {
            "total_energy_kwh": results.get("energy_kwh"),
            "total_carbon_kg": results.get("carbon_kg"),
            "energy_per_epoch": results.get("energy_per_epoch")
        },
        "dataset": {
            "samples": results.get("num_samples"),
            "features": results.get("num_features")
        },
        "model": {
            "name": results.get("model")
        },
        "system": results.get("system_info"),
        "recommendations": recommendations
    }

    with open(json_path, "w") as f:
        json.dump(structured_payload, f, indent=4)

    # Also try to include recent CodeCarbon emissions.csv rows if present
    try:
        if os.path.exists("emissions.csv"):
            df_em = pd.read_csv("emissions.csv")
            # include the last 3 rows for context
            structured_payload["raw_emissions_preview"] = df_em.tail(3).to_dict(orient="records")
            # rewrite with emissions preview
            with open(json_path, "w") as f:
                json.dump(structured_payload, f, indent=4)
    except Exception:
        # non-fatal; continue without raw emissions
        pass

    print(f"\n📁 Saved JSON: {json_path}")
    return json_path


# =====================================================
# MAIN AUDIT ENGINE
# =====================================================
def run_audit(file_path, epochs):

    file_type, data_obj = load_any_file(file_path)

    if file_type == "missing_dependency":
        return None

    print("\n🔍 File Type Detected:", file_type)

    # =================================================
    # TRAINING AUDIT
    # =================================================
    if file_type == "dataframe":

        target = data_obj.columns[-1]
        X = data_obj.drop(columns=[target])
        y = data_obj[target]

        categorical = X.select_dtypes(include=["object"]).columns
        if len(categorical) > 0:
            X = pd.get_dummies(X, drop_first=True)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = RandomForestClassifier(n_estimators=100)

        energy_list = []
        total_energy = 0
        total_carbon = 0

        print("\n🔥 Tracking Training Energy...")

        for ep in range(epochs):
            print(f"\n🔁 Epoch {ep+1}/{epochs}")

            tracker = EmissionsTracker()
            tracker.start()

            model.fit(X_train, y_train)

            emissions = tracker.stop()

            if isinstance(emissions, float):
                carbon = emissions
                energy = None
            else:
                carbon = getattr(emissions, "emissions", None)
                energy = getattr(emissions, "energy_consumed", None)

            if energy is None:
                try:
                    df = pd.read_csv("emissions.csv")
                    energy = df["energy_consumed"].iloc[-1]
                except:
                    energy = 0

            if carbon is None:
                carbon = 0

            print(f"   ⚡ Energy: {energy:.6f} kWh")
            print(f"   🌱 Carbon: {carbon:.6f} kg CO₂")

            energy_list.append(energy)
            total_energy += energy
            total_carbon += carbon

        print(f"\n⚡ Total Energy Used: {total_energy:.6f} kWh")
        print(f"🌱 Total Carbon Emitted: {total_carbon:.6f} kg CO₂")

        return {
            "file_type": "dataset_training",
            "energy_kwh": total_energy,
            "carbon_kg": total_carbon,
            "energy_per_epoch": energy_list,
            "epochs": epochs,
            "num_samples": len(X),
            "num_features": X.shape[1],
            "model": "RandomForest",
            "system_info": get_system_info()
        }

    # =================================================
    # INFERENCE AUDIT
    # =================================================
    elif file_type == "model":

        model = data_obj
        print("\n📦 Model object detected")

        n_features = detect_feature_count(model)
        X_sample = np.random.rand(1000, n_features)

        energy_list = []
        total_energy = 0
        total_carbon = 0

        print("\n🔥 Tracking Inference Energy...")

        for ep in range(epochs):
            print(f"\n🔁 Inference Epoch {ep+1}/{epochs}")

            tracker = EmissionsTracker()
            tracker.start()

            model.predict(X_sample)

            emissions = tracker.stop()

            if isinstance(emissions, float):
                carbon = emissions
                energy = None
            else:
                carbon = getattr(emissions, "emissions", None)
                energy = getattr(emissions, "energy_consumed", None)

            if energy is None:
                try:
                    df = pd.read_csv("emissions.csv")
                    energy = df["energy_consumed"].iloc[-1]
                except:
                    energy = 0

            if carbon is None:
                carbon = 0

            print(f"   ⚡ Energy: {energy:.6f} kWh")
            print(f"   🌱 Carbon: {carbon:.6f} kg CO₂")

            energy_list.append(energy)
            total_energy += energy
            total_carbon += carbon

        print(f"\n⚡ Total Inference Energy: {total_energy:.6f} kWh")
        print(f"🌱 Total Inference Carbon: {total_carbon:.6f} kg CO₂")

        return {
            "file_type": "model_inference",
            "energy_kwh": total_energy,
            "carbon_kg": total_carbon,
            "energy_per_epoch": energy_list,
            "epochs": epochs,
            "model": type(model).__name__,
            "system_info": get_system_info()
        }

    else:
        print("Unsupported file structure.")
        return None


# =====================================================
# ENTRY POINT
# =====================================================
if __name__ == "__main__":

    file_path = input("Enter CSV or PKL file path: ").strip()

    try:
        epochs = int(input("Enter number of epochs [default=1]: ") or 1)
    except:
        epochs = 1

    if not os.path.exists(file_path):
        print("❌ File not found.")
        exit()

    results = run_audit(file_path, epochs)

    if results:
        recommendations = generate_recommendations(results)

        print("\n💡 Recommendations:")
        for r in recommendations:
            print("•", r)

        save_results(results, recommendations)

    print("\n✅ Audit Completed Successfully.")