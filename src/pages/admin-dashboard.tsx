import { useStats, useStations } from "@/hooks/use-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Droplets, Receipt, Building2, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLiters } from "@/lib/format";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: stations } = useStations();

  const usedPercent = stats?.totalChecks ? Math.round((stats.usedChecks / stats.totalChecks) * 100) : 0;
  const pendingPercent = stats?.totalChecks ? Math.round((stats.pendingChecks / stats.totalChecks) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Boshqaruv paneli</h2>
        <p className="text-muted-foreground mt-2">Tizimning umumiy ko'rsatkichlari.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jami mijozlar"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          description="Ro'yxatdan o'tgan"
          loading={statsLoading}
        />
        <StatsCard
          title="Operatorlar"
          value={stats?.totalOperators ?? 0}
          icon={Users}
          description="Faol xodimlar"
          loading={statsLoading}
        />
        <StatsCard
          title="Shaxobchalar"
          value={stats?.totalStations ?? 0}
          icon={Building2}
          description="Faol filiallar"
          loading={statsLoading}
        />
        <StatsCard
          title="Jami litr"
          value={`${formatLiters(stats?.totalLiters)} L`}
          icon={Droplets}
          description="Barcha cheklar"
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tasdiqlangan"
          value={`${formatLiters(stats?.usedLiters)} L`}
          icon={CheckCircle}
          description={`${stats?.usedChecks ?? 0} ta chek`}
          loading={statsLoading}
          variant="success"
        />
        <StatsCard
          title="Kutilayotgan"
          value={`${formatLiters(stats?.pendingLiters)} L`}
          icon={Clock}
          description={`${stats?.pendingChecks ?? 0} ta chek`}
          loading={statsLoading}
          variant="warning"
        />
        <StatsCard
          title="Jami cheklar"
          value={stats?.totalChecks ?? 0}
          icon={Receipt}
          description="Yaratilgan"
          loading={statsLoading}
        />
        <StatsCard
          title="O'rtacha"
          value={stats?.usedChecks && stats?.usedLiters ? `${(stats.usedLiters / stats.usedChecks).toFixed(1)} L` : "0 L"}
          icon={TrendingUp}
          description="Har bir chekda"
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Cheklar holati</CardTitle>
            <CardDescription>Tasdiqlangan va kutilayotgan cheklar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Tasdiqlangan</span>
                </div>
                <span className="font-medium">{usedPercent}%</span>
              </div>
              <Progress value={usedPercent} className="h-2 bg-green-100" />
              <p className="text-xs text-muted-foreground">{stats?.usedChecks ?? 0} ta chek - {formatLiters(stats?.usedLiters)} L</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Kutilayotgan</span>
                </div>
                <span className="font-medium">{pendingPercent}%</span>
              </div>
              <Progress value={pendingPercent} className="h-2 bg-yellow-100" />
              <p className="text-xs text-muted-foreground">{stats?.pendingChecks ?? 0} ta chek - {formatLiters(stats?.pendingLiters)} L</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Shaxobchalar</CardTitle>
            <CardDescription>Filiallar bo'yicha statistika</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stations?.map((station) => (
                <div key={station.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs text-muted-foreground">{station.address || "Manzil kiritilmagan"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{station._count?.checks || 0}</p>
                    <p className="text-xs text-muted-foreground">chek</p>
                  </div>
                </div>
              ))}
              {(!stations || stations.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Shaxobchalar yo'q</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, description, loading, variant }: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  loading: boolean;
  variant?: "success" | "warning";
}) {
  const variantStyles = {
    success: "border-green-200 bg-green-50/50",
    warning: "border-yellow-200 bg-yellow-50/50",
  };

  const iconStyles = {
    success: "text-green-600",
    warning: "text-yellow-600",
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 border-border/50 ${variant ? variantStyles[variant] : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant ? iconStyles[variant] : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-[100px] mb-2" /> : (
          <>
            <div className="text-2xl font-bold font-display text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
