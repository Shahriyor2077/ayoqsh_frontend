import { useState } from "react";
import { useMessages, useSendMessage } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send, MessageSquare, Loader2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMessageSchema } from "@/types";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function MessagesPage() {
    const { user } = useAuth();
    const { data: messages, isLoading } = useMessages();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold">Xabarlar</h2>
                    <p className="text-muted-foreground mt-1">Barcha mijozlarga xabar yuborish.</p>
                </div>
                <SendMessageDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} senderId={user?.id || 0} />
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : messages?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Hali xabar yuborilmagan.
                    </div>
                ) : (
                    messages?.map((message) => (
                        <Card key={message.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        {message.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        {message._count?.recipients || 0} qabul qiluvchi
                                    </div>
                                </div>
                                <CardDescription>
                                    {message.sender?.fullName || message.sender?.username} tomonidan - {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function SendMessageDialog({ open, onOpenChange, senderId }: { open: boolean; onOpenChange: (o: boolean) => void; senderId: number }) {
    const sendMessage = useSendMessage();
    const form = useForm<z.infer<typeof createMessageSchema>>({
        resolver: zodResolver(createMessageSchema),
        defaultValues: { title: "", content: "", senderId },
    });

    const onSubmit = (values: z.infer<typeof createMessageSchema>) => {
        sendMessage.mutate({ ...values, senderId }, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                    <Send className="w-4 h-4 mr-2" />
                    Xabar yuborish
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Yangi xabar</DialogTitle>
                    <DialogDescription>Barcha mijozlarga xabar yuborish.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sarlavha</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Xabar sarlavhasi" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Matn</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Xabar matni..."
                                            className="min-h-32"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={sendMessage.isPending}>
                                {sendMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yuborish
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
