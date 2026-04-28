import { AlertCircle, WifiOff, TrendingUp } from "lucide-react";

export function GasHistoryLoading() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-12 pb-6 px-4">
        <h1 className="text-2xl font-bold text-white mb-1">Gas Price History</h1>
        <p className="text-primary-foreground/80 text-sm">
          Track average fuel price changes over time
        </p>
      </div>

      <div className="px-4 space-y-6 -mt-3">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading price history...</p>
        </div>
      </div>
    </div>
  );
}

export function GasHistoryEmpty() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-12 pb-6 px-4">
        <h1 className="text-2xl font-bold text-white mb-1">Gas Price History</h1>
        <p className="text-primary-foreground/80 text-sm">
          Track average fuel price changes over time
        </p>
      </div>

      <div className="px-4 space-y-6 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No price history available yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once more verified updates are submitted, trends will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export function GasHistoryError() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-12 pb-6 px-4">
        <h1 className="text-2xl font-bold text-white mb-1">Gas Price History</h1>
        <p className="text-primary-foreground/80 text-sm">
          Track average fuel price changes over time
        </p>
      </div>

      <div className="px-4 space-y-6 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Unable to load price history</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Please check your connection and try again.
          </p>
          <button className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function GasHistoryOffline() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-12 pb-6 px-4">
        <h1 className="text-2xl font-bold text-white mb-1">Gas Price History</h1>
        <p className="text-primary-foreground/80 text-sm">
          Track average fuel price changes over time
        </p>
      </div>

      <div className="px-4 space-y-6 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-10 h-10 text-warning" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">You are offline</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Showing the last saved price history data.
          </p>
        </div>
      </div>
    </div>
  );
}
