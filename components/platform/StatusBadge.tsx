import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, Mail, Sparkles } from 'lucide-react';

type SignupStatus = 'pending' | 'email_verified' | 'approved' | 'rejected';

interface StatusBadgeProps {
    status: SignupStatus;
    className?: string;
}

const statusConfig = {
    pending: {
        label: 'Chờ xác nhận',
        icon: Clock,
        className: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20',
        iconClassName: 'text-amber-400',
    },
    email_verified: {
        label: 'Đã xác nhận email',
        icon: Mail,
        className: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/20',
        iconClassName: 'text-blue-400',
    },
    approved: {
        label: 'Đã duyệt',
        icon: CheckCircle2,
        className: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20',
        iconClassName: 'text-emerald-400',
    },
    rejected: {
        label: 'Từ chối',
        icon: XCircle,
        className: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20',
        iconClassName: 'text-red-400',
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                'px-3 py-1.5 font-semibold flex items-center gap-2 w-fit backdrop-blur-sm transition-all duration-200 hover:scale-105',
                config.className,
                className
            )}
        >
            <Icon className={cn('w-3.5 h-3.5', config.iconClassName)} />
            {config.label}
            {status === 'pending' && <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />}
        </Badge>
    );
}
