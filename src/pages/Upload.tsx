import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Zap, Leaf, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuditResult } from "@/types/audit";

const UploadPage = () => {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      if (!file.name.endsWith(".json")) {
        setError("Please upload a JSON audit result file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as AuditResult;
          if (!data.experiment || !data.metrics || !data.recommendations) {
            setError("Invalid audit JSON structure. Please run final.py first.");
            return;
          }
          navigate("/dashboard", { state: { auditData: data } });
        } catch {
          setError("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    },
    [navigate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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
          Upload your CodeCarbon audit JSON to visualize energy consumption,
          carbon footprint, and get optimization recommendations.
        </p>
      </div>

      {/* Flow Steps */}
      <div className="flex items-center gap-4 mb-10 text-sm text-muted-foreground">
        {[
          { icon: <FileJson className="h-4 w-4" />, label: "Run final.py locally" },
          { icon: <UploadIcon className="h-4 w-4" />, label: "Upload JSON result" },
          { icon: <Leaf className="h-4 w-4" />, label: "View dashboard" },
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

      {/* Upload Area */}
      <Card className="w-full max-w-lg border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <label
            className={`flex flex-col items-center justify-center p-12 cursor-pointer transition-colors rounded-lg ${
              dragOver ? "bg-primary/10" : "hover:bg-secondary/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <UploadIcon className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium mb-1">
              {fileName || "Drop your audit JSON here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button variant="outline" size="sm" asChild>
              <span>Select File</span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 text-destructive text-sm font-medium">{error}</p>
      )}

      {/* Instructions */}
      <div className="mt-10 max-w-lg w-full">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          How to generate the audit file
        </h3>
        <Card className="bg-secondary/30">
          <CardContent className="p-4 font-mono text-sm space-y-1 text-muted-foreground">
            <p>$ python final.py</p>
            <p className="text-foreground/70">Enter CSV or PKL file path: data.csv</p>
            <p className="text-foreground/70">Enter number of epochs [default=1]: 5</p>
            <p className="text-accent">✅ Saved JSON: results/audit_*.json</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
