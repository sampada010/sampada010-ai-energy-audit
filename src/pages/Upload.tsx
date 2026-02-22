import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  Zap,
  Leaf,
  FileUp,
  Loader2,
  BarChart3,
  Cpu,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:5000/api/audit";

const UploadPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [epochsValue, setEpochsValue] = useState("1");
  const [loading, setLoading] = useState(false);

  const epochs = Math.max(1, parseInt(epochsValue) || 1);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.endsWith(".csv") && !f.name.endsWith(".pkl")) {
        toast({
          title: "Invalid file",
          description: "Please upload a .csv or .pkl file.",
          variant: "destructive",
        });
        return;
      }
      setFile(f);
    },
    [toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("epochs", epochs.toString());

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Audit failed");
      }

      const auditData = await res.json();
      navigate("/dashboard", { state: { auditData } });
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.message === "Failed to fetch"
            ? "Cannot connect to backend. Make sure Flask server is running on localhost:5000"
            : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Cpu className="h-5 w-5 text-primary" />,
      title: "Hardware Tracking",
      desc: "CPU, GPU & RAM power draw",
    },
    {
      icon: <Leaf className="h-5 w-5 text-[hsl(var(--success))]" />,
      title: "Carbon Footprint",
      desc: "CO₂ emissions per training run",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-accent" />,
      title: "Per-Epoch Analysis",
      desc: "Energy breakdown by epoch",
    },
    {
      icon: <Globe className="h-5 w-5 text-[hsl(var(--chart-energy))]" />,
      title: "Region Aware",
      desc: "Country-level grid intensity",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Branding & Features */}
      <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 bg-secondary/20">
        <div className="max-w-lg mx-auto lg:mx-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/20">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Energy Efficiency
              <br />
              <span className="text-accent">Audit</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-base lg:text-lg mb-10 leading-relaxed">
            Measure the energy consumption and carbon footprint of your ML
            training pipeline. Upload a dataset or model and get an in-depth
            efficiency report powered by CodeCarbon.
          </p>

          {/* Flow Steps */}
          <div className="flex items-center gap-3 mb-10 text-sm text-muted-foreground">
            {[
              { icon: <FileUp className="h-4 w-4" />, label: "Upload" },
              { icon: <Zap className="h-4 w-4" />, label: "Audit" },
              { icon: <Leaf className="h-4 w-4" />, label: "Report" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-muted-foreground/40">→</span>
                )}
                <div className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5 border border-border/50">
                  {step.icon}
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/50"
              >
                <div className="shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Upload Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <Card className="w-full max-w-md border-border/60">
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Upload your file</h2>
              <p className="text-sm text-muted-foreground">
                Accepts <span className="text-accent font-medium">.csv</span>{" "}
                (dataset) or{" "}
                <span className="text-accent font-medium">.pkl</span> (model)
              </p>
            </div>

            {/* Drop Zone */}
            <label
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "bg-primary/10 border-primary/50 scale-[1.01]"
                  : file
                  ? "border-accent/50 bg-accent/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div
                className={`p-3 rounded-full mb-3 ${
                  file ? "bg-accent/20" : "bg-primary/10"
                }`}
              >
                <UploadIcon
                  className={`h-8 w-8 ${
                    file ? "text-accent" : "text-primary"
                  }`}
                />
              </div>
              {file ? (
                <>
                  <p className="text-base font-medium text-accent">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium">
                    Drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".csv,.pkl"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>

            {/* Epochs Input */}
            <div className="space-y-2">
              <Label htmlFor="epochs" className="text-sm">
                Number of Epochs
              </Label>
              <Input
                id="epochs"
                type="number"
                min={1}
                max={100}
                value={epochsValue}
                onChange={(e) => setEpochsValue(e.target.value)}
                onBlur={() => {
                  if (!epochsValue || parseInt(epochsValue) < 1) {
                    setEpochsValue("1");
                  }
                }}
                className="bg-secondary/30"
                placeholder="e.g. 5"
              />
              <p className="text-xs text-muted-foreground">
                More epochs = more accurate measurement but longer runtime
              </p>
            </div>

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              disabled={!file || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Audit...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Energy Audit
                </>
              )}
            </Button>

            {loading && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                CodeCarbon is measuring energy consumption. This may take a
                while…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
