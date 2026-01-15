import { useState } from "react";

const FC_NAME = {
  1: "Coils Status",
  2: "Input Status",
  3: "Holding Register",
  4: "Input Register",
};

const WirteRegister = ({ data, onConfirm }) => {
  if (!data) return null;

  const isBool = data.readFc == 1;
  const canWrite = data.readFc == 1 || data.readFc == 3;

  return (
    <div className="space-y-3">
      <div className="text-xs opacity-70 space-y-1">
        <div>IP: {data.ip}</div>
        <div>Unit ID: {data.unitId}</div>
        <div>
          FC {data.readFc} – {FC_NAME[data.readFc]}
        </div>
        <div>Address: {data.address}</div>
      </div>

      {!canWrite && (
        <div className="alert alert-warning text-xs">
          This Function Code is READ ONLY
        </div>
      )}

      {canWrite && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold">Value</label>

          {isBool ? (
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={Boolean(data.value)}
              onChange={(e) => onConfirm({ ...data, value: e.target.checked })}
            />
          ) : (
            <input
              type="number"
              className="input input-bordered w-full"
              value={data.value}
              onChange={(e) =>
                onConfirm({ ...data, value: Number(e.target.value) })
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WirteRegister;
