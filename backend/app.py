import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from final import run_audit, generate_recommendations

app = Flask(__name__)
CORS(app)


@app.route("/api/audit", methods=["POST"])
def audit():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    epochs = int(request.form.get("epochs", 1))

    if not file.filename.endswith((".csv", ".pkl")):
        return jsonify({"error": "Only .csv and .pkl files are supported"}), 400

    # Save uploaded file temporarily
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        results = run_audit(tmp_path, epochs)

        if results is None:
            return jsonify({"error": "Audit failed. Check file format."}), 500

        recommendations = generate_recommendations(results)

        # Build structured payload (same as save_results in final.py)
        payload = {
            "experiment": {
                "type": results.get("file_type"),
                "epochs": results.get("epochs"),
                "timestamp": "",
            },
            "metrics": {
                "total_energy_kwh": results.get("energy_kwh"),
                "total_carbon_kg": results.get("carbon_kg"),
                "energy_per_epoch": results.get("energy_per_epoch"),
            },
            "dataset": {
                "samples": results.get("num_samples"),
                "features": results.get("num_features"),
            }
            if results.get("num_samples")
            else None,
            "model": {"name": results.get("model")},
            "system": results.get("system_info"),
            "recommendations": recommendations,
        }

        # Try to include raw emissions preview
        try:
            import pandas as pd

            if os.path.exists("emissions.csv"):
                df_em = pd.read_csv("emissions.csv")
                payload["raw_emissions_preview"] = (
                    df_em.tail(3).where(df_em.notna(), None).to_dict(orient="records")
                )
        except Exception:
            pass

        return jsonify(payload)

    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
