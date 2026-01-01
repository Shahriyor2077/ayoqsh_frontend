import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
    username: z.string().min(1, "Foydalanuvchi nomi kiritilishi shart"),
    password: z.string().min(1, "Parol kiritilishi shart"),
});

export default function OperatorLoginPage() {
    const { loginMutation, user, logoutMutation } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const hasCheckedRole = useRef(false);
    const hasShownToast = useRef(false);

    useEffect(() => {
        if (user && !hasCheckedRole.current) {
            hasCheckedRole.current = true;
            if (user.role === "operator") {
                setLocation("/");
            } else {
                // Boshqa rol - chiqish va "login yoki parol xato" xabari
                logoutMutation.mutate();
                if (!hasShownToast.current) {
                    hasShownToast.current = true;
                    toast({
                        title: "Kirish muvaffaqiyatsiz",
                        description: "Login yoki parol noto'g'ri",
                        variant: "destructive",
                    });
                }
            }
        }
        if (!user) {
            hasCheckedRole.current = false;
        }
    }, [user, setLocation]);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    function onSubmit(values: z.infer<typeof loginSchema>) {
        loginMutation.mutate(values);
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 mb-4">
                        <Droplets className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">NBS GAZ OIL</h1>
                    <p className="text-slate-500">Operator paneli</p>
                </div>

                <Card className="border-border/50 shadow-2xl shadow-cyan-900/10 backdrop-blur-sm bg-white/95">
                    <CardHeader>
                        <CardTitle>Kirish</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Login</FormLabel>
                                            <FormControl>
                                                <Input placeholder="operator1" {...field} className="h-12 text-lg" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parol</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/50" />
                                                    <Input type="password" placeholder="••••••••" className="pl-10 h-12 text-lg" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-14 mt-2 text-lg bg-cyan-600 hover:bg-cyan-700 shadow-lg" disabled={loginMutation.isPending}>
                                    {loginMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Kirish...</> : "KIRISH"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
