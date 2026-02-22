import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuditResult } from "@/types/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Leaf,
  Clock,
  Cpu,
  ArrowLeft,
  Lightbulb,
  BarChart3,
  Monitor,
  Database,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.auditData as AuditResult | undefined;

  useEffect(() => {
    if (!data) navigate("/");
  }, [data, navigate]);

  if (!data) return null;

  const { experiment, metrics, dataset, model, system, recommendations, raw_emissions_preview } = data;

  // Chart data
  const epochData = metrics.energy_per_epoch.map((val, i) => ({
    epoch: `Epoch ${i + 1}`,
    energy: val * 1e6, // convert to µWh for readability
  }));

  const lastEmission = raw_emissions_preview?.[raw_emissions_preview.length - 1];
  const powerBreakdown = lastEmission
    ? [
        { name: "CPU", value: lastEmission.cpu_power, color: "hsl(350, 80%, 55%)" },
        { name: "GPU", value: lastEmission.gpu_power, color: "hsl(35, 90%, 55%)" },
        { name: "RAM", value: lastEmission.ram_power, color: "hsl(190, 80%, 50%)" },
      ]
    : [];

  const energyBreakdown = lastEmission
    ? [
        { name: "CPU", value: lastEmission.cpu_energy * 1e6 },
        { name: "GPU", value: lastEmission.gpu_energy * 1e6 },
        { name: "RAM", value: lastEmission.ram_energy * 1e6 },
      ]
    : [];

  const cumulativeData = metrics.energy_per_epoch.reduce<
    { epoch: string; cumulative: number }[]
  >((acc, val, i) => {
    const prev = i > 0 ? acc[i - 1].cumulative : 0;
    acc.push({ epoch: `E${i + 1}`, cumulative: (prev + val) * 1e6 });
    return acc;
  }, []);

  const formatTimestamp = (ts: string) => {
    const match = ts.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (!match) return ts;
    return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`;
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Energy Efficiency Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {experiment.type === "dataset_training" ? "Training" : "Inference"} Audit
            {" · "}Model <span className="text-accent font-medium">{model.name}</span>
            {" · "}{formatTimestamp(experiment.timestamp)}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Load another file
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Energy"
          value={`${(metrics.total_energy_kwh * 1000).toFixed(4)} Wh`}
          color="text-accent"
          borderColor="border-l-accent"
        />
        <MetricCard
          icon={<Leaf className="h-5 w-5" />}
          label="Carbon Emitted"
          value={`${(metrics.total_carbon_kg * 1000).toFixed(4)} g CO₂`}
          color="text-[hsl(var(--chart-carbon))]"
          borderColor="border-l-[hsl(130,60%,45%)]"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Epochs"
          value={experiment.epochs.toString()}
          color="text-primary"
          borderColor="border-l-primary"
        />
        <MetricCard
          icon={<Cpu className="h-5 w-5" />}
          label="CPU Cores"
          value={system.cpu_count.toString()}
          color="text-[hsl(var(--chart-ram))]"
          borderColor="border-l-[hsl(190,80%,50%)]"
        />
      </div>

      {/* Dataset + System Info */}
      {dataset && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard icon={<Database className="h-4 w-4" />} label="Samples" value={dataset.samples.toLocaleString()} />
          <InfoCard icon={<BarChart3 className="h-4 w-4" />} label="Features" value={dataset.features.toString()} />
          <InfoCard icon={<Monitor className="h-4 w-4" />} label="Platform" value={system.platform.split("-").slice(0, 2).join(" ")} />
          <InfoCard icon={<Cpu className="h-4 w-4" />} label="Python" value={system.python_version} />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Energy Per Epoch Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Energy Per Epoch (µWh)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={epochData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 20%)" />
                <XAxis dataKey="epoch" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220, 25%, 13%)",
                    border: "1px solid hsl(220, 20%, 20%)",
                    borderRadius: 8,
                    color: "hsl(210, 40%, 96%)",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} µWh`, "Energy"]}
                />
                <Bar dataKey="energy" fill="hsl(35, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative Energy Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Cumulative Energy (µWh)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 20%)" />
                <XAxis dataKey="epoch" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220, 25%, 13%)",
                    border: "1px solid hsl(220, 20%, 20%)",
                    borderRadius: 8,
                    color: "hsl(210, 40%, 96%)",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} µWh`, "Cumulative"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(350, 80%, 55%)"
                  fill="hsl(350, 80%, 55%)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Power Breakdown Pie */}
        {powerBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Power Draw (W)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={powerBreakdown.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}W`}
                  >
                    {powerBreakdown
                      .filter((d) => d.value > 0)
                      .map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220, 25%, 13%)",
                      border: "1px solid hsl(220, 20%, 20%)",
                      borderRadius: 8,
                      color: "hsl(210, 40%, 96%)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Energy Breakdown by Component */}
        {energyBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Energy by Component (µWh) — Last Epoch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={energyBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 20%)" />
                  <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} width={50} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220, 25%, 13%)",
                      border: "1px solid hsl(220, 20%, 20%)",
                      borderRadius: 8,
                      color: "hsl(210, 40%, 96%)",
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} µWh`, "Energy"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    <Cell fill="hsl(350, 80%, 55%)" />
                    <Cell fill="hsl(35, 90%, 55%)" />
                    <Cell fill="hsl(190, 80%, 50%)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/90">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Emissions Preview */}
      {lastEmission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              System Snapshot (Last Epoch)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
              {[
                ["CPU Model", lastEmission.cpu_model],
                ["Country", lastEmission.country_name],
                ["RAM Total", `${lastEmission.ram_total_size.toFixed(1)} GB`],
                ["RAM Used", `${lastEmission.ram_utilization_percent}%`],
                ["Duration", `${lastEmission.duration.toFixed(2)}s`],
                ["Emission Rate", `${(lastEmission.emissions_rate * 1e6).toFixed(2)} µg/s`],
              ].map(([label, val]) => (
                <div key={label} className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-medium truncate">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sub-components
const MetricCard = ({
  icon,
  label,
  value,
  color,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  borderColor: string;
}) => (
  <Card className={`border-l-4 ${borderColor}`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Card className="bg-secondary/30">
    <CardContent className="p-3 flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
