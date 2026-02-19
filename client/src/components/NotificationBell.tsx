import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationBell() {
  const { toast } = useToast();
  
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 h-96">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground" data-testid="notification-empty-state">
            No notifications
          </div>
        ) : (
          <div className="overflow-y-auto h-full space-y-2">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors ${
                  notification.isRead ? "opacity-60" : "bg-blue-50 dark:bg-blue-950"
                }`}
                onClick={() => handleMarkRead(notification.id)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="font-semibold text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
