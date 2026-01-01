import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
    username: z.string().min(1, "Foydalanuvchi nomi kiritilishi shart"),
    password: z.string().min(1, "Parol kiritilishi shart"),
});

export default function AdminLoginPage() {
    const { loginMutation, user, logoutMutation } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const hasCheckedRole = useRef(false);
    const hasShownToast = useRef(false);

    useEffect(() => {
        if (user && !hasCheckedRole.current) {
            hasCheckedRole.current = true;
            if (user.role === "moderator") {
                setLocation("/");
            } else {
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
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/30 mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white">Moderator Panel</h1>
                    <p className="text-slate-400">Moderator sifatida kirish</p>
                </div>

                <Card className="border-slate-700 shadow-2xl bg-slate-800/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Kirish</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Login</FormLabel>
                                            <FormControl>
                                                <Input placeholder="admin" {...field} className="h-11 bg-slate-700 border-slate-600 text-white" />
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
                                            <FormLabel className="text-slate-300">Parol</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                    <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-slate-700 border-slate-600 text-white" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700" disabled={loginMutation.isPending}>
                                    {loginMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kirish...</> : "Kirish"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
