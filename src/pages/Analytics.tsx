import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Mic2,
  Clock,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Generation {
  id: string;
  title: string | null;
  voice_name: string;
  voice_id: string;
  duration_seconds: number | null;
  created_at: string;
  text_input: string;
}

const CHART_COLORS = [
  "hsl(14, 80%, 58%)",
  "hsl(30, 70%, 55%)",
  "hsl(45, 65%, 55%)",
  "hsl(170, 50%, 45%)",
  "hsl(210, 60%, 55%)",
  "hsl(260, 50%, 55%)",
];

const Analytics = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchGenerations();
  }, [user, authLoading]);

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select("id, title, voice_name, voice_id, duration_seconds, created_at, text_input")
      .order("created_at", { ascending: true });

    if (!error) setGenerations(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalEpisodes = generations.length;
    const totalDuration = generations.reduce(
      (sum, g) => sum + (g.duration_seconds || 0),
      0
    );
    const totalWords = generations.reduce(
      (sum, g) => sum + g.text_input.split(/\s+/).length,
      0
    );
    const avgDuration = totalEpisodes ? totalDuration / totalEpisodes : 0;
    return { totalEpisodes, totalDuration, totalWords, avgDuration };
  }, [generations]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; count: number; duration: number }>();
    generations.forEach((g) => {
      const date = new Date(g.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = map.get(date) || { date, count: 0, duration: 0 };
      existing.count += 1;
      existing.duration += g.duration_seconds || 0;
      map.set(date, existing);
    });
    return Array.from(map.values()).slice(-14);
  }, [generations]);

  const voiceData = useMemo(() => {
    const map = new Map<string, number>();
    generations.forEach((g) => {
      map.set(g.voice_name, (map.get(g.voice_name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [generations]);

  const recentEpisodes = useMemo(
    () => [...generations].reverse().slice(0, 5),
    [generations]
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-display text-lg font-semibold">Analytics</span>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Episodes",
              value: stats.totalEpisodes,
              icon: Mic2,
            },
            {
              label: "Total Duration",
              value: formatDuration(stats.totalDuration),
              icon: Clock,
            },
            {
              label: "Avg Duration",
              value: formatDuration(stats.avgDuration),
              icon: TrendingUp,
            },
            {
              label: "Total Words",
              value: stats.totalWords.toLocaleString(),
              icon: BarChart3,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-bg">
                      <stat.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Episodes Over Time */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">
                  Episodes Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(14, 80%, 58%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(14, 80%, 58%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(14, 80%, 58%)"
                        strokeWidth={2}
                        fill="url(#areaGrad)"
                        name="Episodes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">
                    No data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Voice Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">
                  Voice Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {voiceData.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={voiceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          stroke="none"
                        >
                          {voiceData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {voiceData.map((v, i) => (
                        <div key={v.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                            <span className="text-muted-foreground truncate max-w-[120px]">
                              {v.name}
                            </span>
                          </div>
                          <span className="font-medium">{v.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">
                    No data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Duration Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Duration by Day (seconds)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        fontSize: 13,
                      }}
                    />
                    <Bar
                      dataKey="duration"
                      fill="hsl(14, 80%, 58%)"
                      radius={[6, 6, 0, 0]}
                      name="Duration (s)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">
                  No data yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Episodes Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Episodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEpisodes.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between py-3 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {ep.title || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ep.voice_name} ·{" "}
                          {new Date(ep.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {ep.duration_seconds
                          ? formatDuration(ep.duration_seconds)
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No episodes yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
