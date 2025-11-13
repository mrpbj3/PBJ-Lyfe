// PBJ Health - Dashboard Card Component
// Card-first design for health metrics
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface DashboardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  testId?: string;
}

export function DashboardCard({
  title,
  description,
  children,
  footer,
  actionLabel,
  actionHref,
  onAction,
  className = '',
  testId,
}: DashboardCardProps) {
  return (
    <Card className={`hover-elevate ${className}`} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          )}
        </div>
        {actionLabel && (
          <div>
            {actionHref ? (
              <Link href={actionHref}>
                <Button variant="default" size="sm" data-testid={`button-${testId}-action`}>
                  {actionLabel}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button variant="default" size="sm" onClick={onAction} data-testid={`button-${testId}-action`}>
                {actionLabel}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {footer && <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}
