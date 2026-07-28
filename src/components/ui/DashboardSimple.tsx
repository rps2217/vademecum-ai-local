/**
 * DashboardSimple - Dashboard con métricas
 * 
 * Dashboard actualizado con el nuevo design system.
 */

import React from 'react';
import { StatsCard, StatsCardSkeleton, Card, CardHeader, CardTitle, CardContent, Badge } from '@/ui';
import { useDbStats } from '@/db';
import { Database, Link2, FlaskConical, TrendingUp, Sparkles, Settings, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSimpleProps {
  className?: string;
}

export function DashboardSimple({ className }: DashboardSimpleProps) {
  const stats = useDbStats();

  const statsCards = [
    {
      title: 'Ingredientes',
      value: stats.totalIngredients,
      icon: <FlaskConical className="w-5 h-5" />,
      change: 12,
      changeLabel: 'nuevos este mes',
    },
    {
      title: 'Sinergias',
      value: stats.totalSynergies,
      icon: <Link2 className="w-5 h-5" />,
      change: 5,
      changeLabel: 'vs. anterior',
    },
    {
      title: 'Productos',
      value: stats.totalProducts,
      icon: <Database className="w-5 h-5" />,
    },
    {
      title: 'Protocolos',
      value: stats.totalProtocols,
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const quickActions = [
    { label: 'Buscar ingrediente', icon: <Sparkles className="w-4 h-4" />, href: '/search' },
    { label: 'Ver sinergias', icon: <Link2 className="w-4 h-4" />, href: '/synergies' },
    { label: 'Administración', icon: <Settings className="w-4 h-4" />, href: '/admin' },
    { label: 'Sincronizar', icon: <RefreshCw className="w-4 h-4" />, href: '/settings' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu base de conocimiento</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, idx) => (
          <StatsCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeLabel={stat.changeLabel}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FlaskConical className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevos ingredientes añadidos</p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                </div>
                <Badge variant="success" size="sm">+12</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Link2 className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sinergias actualizadas</p>
                  <p className="text-xs text-muted-foreground">Hace 5 horas</p>
                </div>
                <Badge variant="primary" size="sm">+5</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <RefreshCw className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sincronización completada</p>
                  <p className="text-xs text-muted-foreground">Ayer</p>
                </div>
                <Badge variant="secondary" size="sm">OK</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg',
                    'bg-muted hover:bg-accent',
                    'text-sm font-medium text-foreground',
                    'transition-colors'
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['fitoterapia', 'homeopatia', 'aceite_esencial', 'vitamina', 'mineral', 'probiotico'].map(cat => (
              <Badge key={cat} variant="outline" size="md">
                <FlaskConical className="w-3 h-3 mr-1" />
                {cat.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardSimple;
