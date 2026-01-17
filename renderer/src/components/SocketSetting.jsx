import { useEffect, useState } from "react";

export default function SocketSetting({ modbusRunning, cfg, setCfg }) {
  const disabled = modbusRunning;

  return (
    <div className="space-y-4">
      {/* Enable */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.enabled}
          disabled={disabled}
          onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
        />
        Enable Socket
      </label>

      {/* URL */}
      <div>
        <label className="block text-sm">Socket URL</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="https://example.com"
          disabled={disabled}
          value={cfg.url}
          onChange={(e) => setCfg({ ...cfg, url: e.target.value })}
        />
      </div>

      {/* Token */}
      <div>
        <label className="block text-sm">Token</label>
        <input
          className="w-full border p-2 rounded"
          disabled={disabled}
          value={cfg.token}
          onChange={(e) => setCfg({ ...cfg, token: e.target.value })}
        />
      </div>

      {/* Warning */}
      {disabled && (
        <div className="text-sm text-yellow-600">
          Stop Modbus before editing socket settings
        </div>
      )}
    </div>
  );
}
