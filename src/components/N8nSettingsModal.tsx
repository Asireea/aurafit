import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Send,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { DEFAULT_N8N_CONFIG, n8n } from '../lib/n8n';
import { N8nConfig, N8nLogEntry } from '../types';

interface N8nSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerBatchNotification: () => Promise<void>;
  pendingRecsCount: number;
}

export const N8nSettingsModal: React.FC<N8nSettingsModalProps> = ({
  isOpen,
  onClose,
  onTriggerBatchNotification,
  pendingRecsCount,
}) => {
  const [config, setConfig] = useState<N8nConfig & { simulationMode: boolean }>(n8n.getConfig());
  const [logs, setLogs] = useState<N8nLogEntry[]>(n8n.getLogs());
  const [selectedLog, setSelectedLog] = useState<N8nLogEntry | null>(logs[0] || null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'triggers'>('config');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    n8n.saveConfig(config);
    alert('n8n integration settings saved!');
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    try {
      const res = await n8n.dispatchEvent('TEST_PING', {
        testMessage: 'Ping from AuraFit Web Client',
        environment: 'browser-preview',
        systemTime: new Date().toISOString(),
      });
      setLogs(n8n.getLogs());
      setSelectedLog(res.log);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    n8n.clearLogs();
    setLogs([]);
    setSelectedLog(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">n8n Automation & Webhook Engine</h2>
              <p className="text-xs text-neutral-400">
                Trigger workflows, send coach notification batches, and inspect payloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950/30 px-6 py-2.5">
          <button
            onClick={() => setActiveTab('config')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'config'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Endpoint Configuration
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'triggers'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="h-3 w-3 text-emerald-400" />
            <span>Direct Trigger Actions</span>
            {pendingRecsCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300">
                {pendingRecsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Payload Inspector & Logs</span>
            <span className="rounded-full bg-neutral-800 px-1.5 py-0.2 text-[10px] text-neutral-300">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                  n8n Webhook URL Endpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://your-n8n-instance.com/webhook/aurafit"
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        webhookUrl: DEFAULT_N8N_CONFIG.webhookUrl,
                      })
                    }
                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700"
                    title="Reset to default URL"
                  >
                    Reset
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  When matching occurs, AuraFit sends a POST request with structured JSON payload to this endpoint.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                  Optional API / Bearer Token
                </label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Optional authorization token for protected n8n webhooks"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-neutral-200">Enable n8n Integration</span>
                    <p className="text-[11px] text-neutral-400">
                      Toggle active webhook dispatching on user onboarding & matching
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </label>

                <div className="border-t border-neutral-800/60 pt-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-emerald-300">
                        Simulation Mode (Self-Contained Sandbox)
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        Simulate instant 200 OK webhook confirmations and update recommendation statuses to &apos;notified&apos; without external network dependency.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.simulationMode}
                      onChange={(e) => setConfig({ ...config, simulationMode: e.target.checked })}
                      className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  {isTesting ? 'Sending Ping...' : 'Test Webhook Endpoint'}
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      Batch Notification Dispatcher
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                      Sends a single consolidated <code className="text-emerald-300">NOTIFICATION_BATCH</code> payload
                      to n8n containing all candidate coach matches with status <code className="text-amber-300">pending_notification</code>. Upon completion, their statuses are updated to <code className="text-blue-300">notified</code>.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                      {pendingRecsCount}
                    </span>
                    <div className="text-[11px] text-neutral-500">pending records</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={onTriggerBatchNotification}
                    disabled={pendingRecsCount === 0 || isTesting}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Send Notification Batch ({pendingRecsCount})</span>
                  </button>

                  <button
                    onClick={handleTestPing}
                    disabled={isTesting}
                    className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
                  >
                    <Send className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Send Test Ping</span>
                  </button>
                </div>
              </div>

              {/* Supported n8n events overview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                  Active Webhook Event Payloads
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3.5">
                    <div className="font-mono font-bold text-emerald-400">USER_ONBOARDED</div>
                    <div className="text-neutral-400 mt-1">
                      Fires when a client completes the 3-step wizard with their age, weight, goal, and preferred style.
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3.5">
                    <div className="font-mono font-bold text-blue-400">NEW_MATCH_GENERATED</div>
                    <div className="text-neutral-400 mt-1">
                      Fires when the matching algorithm finishes scoring trainers, sending top compatibility ranks to n8n.
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3.5">
                    <div className="font-mono font-bold text-amber-400">NOTIFICATION_BATCH</div>
                    <div className="text-neutral-400 mt-1">
                      Dispatched when batch notifications are triggered for pending coach proposals.
                    </div>
                  </div>

                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3.5">
                    <div className="font-mono font-bold text-purple-400">RECOMMENDATION_STATUS_CHANGED</div>
                    <div className="text-neutral-400 mt-1">
                      Fires when a user accepts or declines a coach, allowing n8n to sync calendar or CRM records.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Showing last {logs.length} webhook dispatch events
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-8 text-center text-xs text-neutral-500">
                  No webhook events recorded yet. Trigger a test ping or complete onboarding to see live payloads.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Log List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {logs.map((log) => {
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <button
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`w-full rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                              : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {log.event}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                log.status === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.status === 'simulated'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {log.status === 'simulated' ? 'SIMULATED' : log.httpStatus || log.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* JSON Payload Inspector */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                      <span className="text-xs font-semibold text-neutral-300">Payload Inspector</span>
                      {selectedLog && (
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(selectedLog.payload, null, 2))}
                          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
                        >
                          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      )}
                    </div>

                    {selectedLog ? (
                      <div className="space-y-3 overflow-y-auto max-h-68">
                        <div>
                          <div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">
                            Dispatched POST Body:
                          </div>
                          <pre className="rounded bg-neutral-900 p-2.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-neutral-800">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                          </pre>
                        </div>

                        {selectedLog.response && (
                          <div>
                            <div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">
                              Server / Simulation Response:
                            </div>
                            <pre className="rounded bg-neutral-900 p-2.5 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                              {selectedLog.response}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center text-xs text-neutral-500">
                        Select a log to inspect its payload
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
