import React, { useEffect, useState } from "react";

const FC_LIST = [
  { id: 1, label: "Coil" },
  { id: 2, label: "DI" },
  { id: 3, label: "HR" },
  { id: 4, label: "IR" },
];

const FC_NAME = {
  1: "Coil",
  2: "DI",
  3: "Holding Register",
  4: "Input Register",
};

const CardDevices = () => {
  const [devices, setDevices] = useState([]);
  const [fcView, setFcView] = useState({});

  const getConfig = async () => {
    const res = await window.modbusAPI.getConfig();
    setDevices(res.devices || []);
  };

  useEffect(() => {
    getConfig();
  }, []);

  const setFC = (dIdx, fc) => {
    setFcView((prev) => ({ ...prev, [dIdx]: fc }));
  };

  useEffect(() => {
    window.modbusAPI.onChange((items) => {
      const { ip, unitId, fc, start, data } = items;
      setDevices((prevDevices) => {
        return prevDevices.map((device) => {
          if (device.ip != ip) return device;
          const updatedTags = device.tags.map((tag) => {
            if (tag.unitId != unitId || tag.fc != fc) return tag;
            if (
              start < tag.start ||
              start + data.length > tag.start + tag.length
            )
              return tag;
            const newValues = [...(tag.values || [])];
            data.forEach((value, i) => {
              newValues[start - tag.start + i] = value;
            });
            return { ...tag, values: newValues };
          });
          return { ...device, tags: updatedTags };
        });
      });
      
    });
  }, []);

  return devices.map((device, dIdx) => {
    const availableFCs = [...new Set(device.tags.map((t) => t.fc))];
    const activeFC = fcView[dIdx] ?? availableFCs[0];
    const tags = device.tags.filter((t) => t.fc == activeFC);

    return (
      <div key={dIdx} className="w-full card bg-base-100">
        <div className="card-body p-0 space-y-2">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-base">
              {device.ip}:{device.port}
            </h2>
            {/* <span className="badge badge-ghost">
              {device.enabled ? "RUN" : "STOP"}
            </span> */}
          </div>

          {/* FC Selector */}
          <div className="flex gap-4 text-sm">
            {FC_LIST.filter((fc) => availableFCs.includes(fc.id)).map((fc) => (
              <label
                key={fc.id}
                className="flex items-center gap-1 cursor-pointer opacity-80 hover:opacity-100"
              >
                <input
                  type="radio"
                  name={`fc-${dIdx}`}
                  className="radio radio-xs"
                  checked={activeFC === fc.id}
                  onChange={() => setFC(dIdx, fc.id)}
                />
                <span>{fc.label}</span>
              </label>
            ))}
          </div>

          {/* FC Panel */}
          <div className="bg-base-200 rounded-md overflow-hidden">
            {/* FC Title */}
            <div className="px-3 py-1 text-xs font-semibold text-gray-600 bg-base-300">
              FC {activeFC} – {FC_NAME[activeFC]}
            </div>

            {/* Table */}
            <div className="text-xs font-mono max-h-56 overflow-auto">
              <div className="grid grid-cols-2 px-3 py-1 text-gray-500 sticky top-0 bg-base-200">
                <span>Addr</span>
                <span>Value</span>
              </div>

              {tags
                .flatMap((tag) =>
                  Array.from({ length: tag.length }).map((_, i) => {
                    const addr = Number(tag.start) + i;
                    const value =
                      Array.isArray(tag.values) && tag.values[i] !== undefined
                        ? tag.values[i]
                        : "--";

                    return { addr, value, enabled: tag.enabled };
                  })
                )
                .map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-2 px-3 py-1 ${
                      i % 2 === 0 ? "bg-base-200" : "bg-base-100"
                    } ${row.enabled ? "" : "opacity-40"}`}
                  >
                    <span>{row.addr}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  });
};

export default CardDevices;
