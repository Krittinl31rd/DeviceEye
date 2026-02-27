import React, { useEffect, useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import Modal from "./Modal";
import FormUpdateDevice from "./FormUpdateDevice";
import WirteRegister from "./WirteRegister";
import { toast } from "sonner";
import { STATUS_COLOR, STATUS_LABEL, FC_LIST, FC_NAME } from "../utils/enum";
import { getWriteFC } from "../utils/helper";

const CardDevices = ({
  running,
  devices,
  delDeviceConfig,
  delDevice,
  setDelDevice,
  updateDevice,
  setUpdateDevice,
  updateDeviceConfig,
}) => {
  const [runtimeValues, setRuntimeValues] = useState({});
  const [deviceStatus, setDeviceStatus] = useState({});
  const [selectDevice, setSelectDevice] = useState(null);
  const [unitView, setUnitView] = useState({});
  const [fcView, setFcView] = useState({});
  const [writeModal, setWriteModal] = useState(null);

  const getRuntimeValue = (ip, unitId, fc, address) => {
    const unitData = runtimeValues?.[ip]?.[unitId];
    if (!unitData) return "--";
    if (unitData[fc]?.[address] !== undefined) {
      return unitData[fc][address];
    }
    const fallbackFC = Object.values(unitData).find(
      (d) => d?.[address] !== undefined,
    );
    return fallbackFC?.[address] ?? "--";
  };

  const handleWriteOpen = ({ device, unitId, fc, address, value }) => {
    const writeFC = getWriteFC(fc);
    if (!writeFC) return;

    setWriteModal({
      ip: device.ip,
      unitId,
      readFc: fc,
      fc: writeFC,
      address,
      value: value ?? 0,
    });
  };

  const handleWriteConfirm = async () => {
    const { success, message } = await window.modbusAPI.writeModbus(writeModal);

    if (success) toast.success(message);
    setWriteModal(null);
  };

  useEffect(() => {
    return window.modbusAPI?.onStatus?.(({ ip, state, reason }) => {
      setDeviceStatus((prev) => ({
        ...prev,
        [ip]: { state, reason },
      }));
    });
  }, []);

  useEffect(() => {
    if (!running) return setDeviceStatus({});
    return window.modbusAPI?.onChange?.(({ ip, unitId, fc, data }) => {
      setRuntimeValues((prev) => ({
        ...prev,
        [ip]: {
          ...(prev[ip] || {}),
          [unitId]: {
            ...(prev[ip]?.[unitId] || {}),
            [fc]: {
              ...(prev[ip]?.[unitId]?.[fc] || {}),
              ...Object.fromEntries(data.map((d) => [d.address, d.value])),
            },
          },
        },
      }));
    });
  }, [running]);

  if (!devices.length) {
    return (
      <div className="w-full text-center text-sm text-gray-400 py-10">
        No devices configured
      </div>
    );
  }

  return devices.map((device, dIdx) => {
    const unitIds = [...new Set(device.tags.map((t) => t.unitId))];
    const activeUnit = unitView[dIdx] ?? unitIds[0];

    const fcList = [
      ...new Set(
        device.tags.filter((t) => t.unitId === activeUnit).map((t) => t.fc),
      ),
    ];

    const activeFC = fcView[dIdx]?.[activeUnit] ?? fcList[0];

    const unitTags = device.tags.filter(
      (t) => t.unitId == activeUnit && t.fc == activeFC,
    );

    const isOffline = deviceStatus[device.ip]?.state != "CONNECTED";

    return (
      <div
        key={device.ip}
        className="bg-base-200 rounded-2xl p-4 shadow-xl border border-base-300 space-y-4 transition hover:shadow-2xl"
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">
              {device.ip}:{device.port}
            </h2>

            {deviceStatus[device.ip] && (
              <div className="mt-1 text-sm flex items-center gap-2">
                <span
                  className={`badge badge-sm ${
                    STATUS_COLOR[deviceStatus[device.ip].state]
                  }`}
                >
                  {STATUS_LABEL[deviceStatus[device.ip].state]}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              disabled={running}
              className="btn btn-sm btn-outline btn-warning"
              onClick={() => {
                setSelectDevice({
                  ...structuredClone(device),
                  _originalIp: device.ip,
                });
                setUpdateDevice(true);
              }}
            >
              <PencilLine size={16} />
            </button>

            <button
              disabled={running}
              className="btn btn-sm btn-outline btn-error"
              onClick={() => {
                setSelectDevice(device);
                setDelDevice(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* ================= UNIT ================= */}
        <div className="flex gap-3 text-sm">
          {unitIds.map((uid) => (
            <label key={uid} className="flex gap-1 cursor-pointer">
              <button
                className={`px-3 py-1 rounded-full text-sm transition ${
                  activeUnit === uid
                    ? "bg-primary text-white"
                    : "bg-base-100 hover:bg-base-300"
                }`}
                onClick={() => setUnitView((v) => ({ ...v, [dIdx]: uid }))}
              >
                ID {uid}
              </button>
            </label>
          ))}
        </div>

        {/* ================= FC ================= */}
        <div className="flex gap-3 text-xs my-1">
          {fcList.map((fc) => (
            <label key={fc} className="flex gap-1 cursor-pointer">
              <input
                type="radio"
                className="radio radio-xs"
                checked={activeFC === fc}
                onChange={() =>
                  setFcView((v) => ({
                    ...v,
                    [dIdx]: { ...(v[dIdx] || {}), [activeUnit]: fc },
                  }))
                }
              />
              FC {fc} ({FC_LIST.find((f) => f.id == fc)?.label})
            </label>
          ))}
        </div>

        {/* ================= TABLE ================= */}
        <div className="relative bg-base-200 rounded">
          {isOffline && (
            <div className="absolute inset-0 bg-base-100/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <span className="text-error font-semibold">Device Offline</span>
            </div>
          )}
          <div className="px-3 py-1 text-xs font-semibold bg-base-300">
            Unit {activeUnit} | FC {activeFC} – {FC_NAME[activeFC]}
          </div>

          <div className="max-h-[500px] overflow-auto">
            <div className="min-w-max text-xs font-mono p-2">
              {unitTags.map((tag) => {
                const addresses = Array.from({ length: tag.length }).map(
                  (_, i) => Number(tag.start) + i,
                );

                const ROWS = 5;
                const cols = Math.ceil(addresses.length / ROWS);

                return (
                  <div
                    key={`${tag.unitId}-${tag.fc}`}
                    className="grid gap-2"
                    style={{
                      gridTemplateRows: `repeat(${ROWS}, auto)`,
                      gridTemplateColumns: `repeat(${cols}, 90px)`,
                      gridAutoFlow: "column",
                    }}
                  >
                    {addresses.map((addr) => {
                      const value = getRuntimeValue(
                        device.ip,
                        activeUnit,
                        activeFC,
                        addr,
                      );

                      return (
                        <div
                          key={addr}
                          className="overflow-x-auto group bg-base-100 hover:bg-primary/5 border border-base-300 rounded-xl p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-md"
                          onClick={() =>
                            handleWriteOpen({
                              device,
                              unitId: activeUnit,
                              fc: activeFC,
                              address: addr,
                              value,
                            })
                          }
                        >
                          {/* ADDRESS */}
                          <div className="text-[11px] font-medium text-white tracking-wide">
                            {addr.toString().padStart(4, "0")}
                          </div>

                          {/* VALUE */}
                          <div className="text-lg font-bold text-primary mt-1 tabular-nums">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= MODALS ================= */}
        {delDevice && (
          <Modal
            title={`Delete ${selectDevice?.ip}`}
            show
            onClose={() => setDelDevice(false)}
            confirm={() => delDeviceConfig(selectDevice.ip)}
          >
            Confirm delete device?
          </Modal>
        )}

        {updateDevice && (
          <Modal
            title={`Update ${selectDevice?.ip}`}
            show
            onClose={() => setUpdateDevice(false)}
            confirm={() => updateDeviceConfig(selectDevice)}
          >
            <FormUpdateDevice
              formDevice={selectDevice}
              setFormDevice={setSelectDevice}
            />
          </Modal>
        )}

        {writeModal && running && (
          <Modal
            title="Write Modbus"
            show
            onClose={() => setWriteModal(null)}
            confirm={handleWriteConfirm}
          >
            <WirteRegister data={writeModal} onConfirm={setWriteModal} />
          </Modal>
        )}
      </div>
    );
  });
};

export default CardDevices;
