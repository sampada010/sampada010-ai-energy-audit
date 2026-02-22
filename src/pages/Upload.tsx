import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Zap, Leaf, FileUp, Loader2 } from "lucide-react";
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
  const [epochs, setEpochs] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv") && !f.name.endsWith(".pkl")) {
      toast({
        title: "Invalid file",
        description: "Please upload a .csv or .pkl file.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
  }, [toast]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Energy Efficiency Audit
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your dataset (.csv) or model (.pkl) file along with the number
          of epochs to run the CodeCarbon energy audit.
        </p>
      </div>

      {/* Flow Steps */}
      <div className="flex items-center gap-4 mb-10 text-sm text-muted-foreground flex-wrap justify-center">
        {[
          { icon: <FileUp className="h-4 w-4" />, label: "Upload CSV / PKL" },
          { icon: <Zap className="h-4 w-4" />, label: "Run Energy Audit" },
          { icon: <Leaf className="h-4 w-4" />, label: "View Dashboard" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-border">→</span>}
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1.5">
              {step.icon}
              <span>{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Card */}
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 space-y-6">
          {/* Drop Zone */}
          <label
            className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragOver
                ? "bg-primary/10 border-primary/50"
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
            <div className={`p-3 rounded-full mb-3 ${file ? "bg-accent/20" : "bg-primary/10"}`}>
              <UploadIcon className={`h-8 w-8 ${file ? "text-accent" : "text-primary"}`} />
            </div>
            {file ? (
              <>
                <p className="text-base font-medium text-accent">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB · Click to change
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-medium">Drop your CSV or PKL file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
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
              value={epochs}
              onChange={(e) => setEpochs(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-secondary/30"
            />
            <p className="text-xs text-muted-foreground">
              More epochs = more accurate energy measurement but longer runtime
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
              CodeCarbon is measuring energy consumption. This may take a while depending on epochs and dataset size...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backend instructions */}
      <div className="mt-10 max-w-lg w-full">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Backend Setup (run locally)
        </h3>
        <Card className="bg-secondary/30">
          <CardContent className="p-4 font-mono text-sm space-y-1 text-muted-foreground">
            <p>$ cd backend</p>
            <p>$ pip install -r requirements.txt</p>
            <p>$ python app.py</p>
            <p className="text-accent">✅ Server running on http://localhost:5000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
