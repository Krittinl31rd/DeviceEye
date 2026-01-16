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
      (d) => d?.[address] !== undefined
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
        device.tags.filter((t) => t.unitId === activeUnit).map((t) => t.fc)
      ),
    ];

    const activeFC = fcView[dIdx]?.[activeUnit] ?? fcList[0];

    const unitTags = device.tags.filter(
      (t) => t.unitId == activeUnit && t.fc == activeFC
    );

    const isOffline = deviceStatus[device.ip]?.state != "CONNECTED";

    return (
      <div
        key={device.ip}
        className="card bg-base-300 p-2 shadow-2xl space-y-2"
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-semibold flex items-center gap-2">
            {device.ip}:{device.port}
            {deviceStatus[device.ip] && (
              <span
                className={`text-xs ${
                  STATUS_COLOR[deviceStatus[device.ip].state]
                }`}
              >
                ● {STATUS_LABEL[deviceStatus[device.ip].state]}
              </span>
            )}
          </h2>

          <div className="flex gap-2">
            <button
              disabled={running}
              className="btn btn-xs btn-warning"
              onClick={() => {
                setSelectDevice(structuredClone(device));
                setUpdateDevice(true);
              }}
            >
              <PencilLine size={14} />
            </button>
            <button
              disabled={running}
              className="btn btn-xs btn-error"
              onClick={() => {
                setSelectDevice(device);
                setDelDevice(true);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* ================= UNIT ================= */}
        <div className="flex gap-3 text-sm">
          {unitIds.map((uid) => (
            <label key={uid} className="flex gap-1 cursor-pointer">
              <input
                type="radio"
                className="radio radio-xs"
                checked={activeUnit === uid}
                onChange={() => setUnitView((v) => ({ ...v, [dIdx]: uid }))}
              />
              ID {uid}
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
              FC {fc} ({FC_LIST.find((f) => f.id === fc)?.label})
            </label>
          ))}
        </div>

        {/* ================= TABLE ================= */}
        <div className={`bg-base-200 rounded ${isOffline && "opacity-40"}`}>
          <div className="px-3 py-1 text-xs font-semibold bg-base-300">
            Unit {activeUnit} | FC {activeFC} – {FC_NAME[activeFC]}
          </div>

          <div className="text-xs font-mono max-h-56 overflow-auto space-y-0.5">
            <div className="grid grid-cols-2 px-4 py-2 text-gray-500 sticky top-0 bg-base-100">
              <span>Addr</span>
              <span className="text-center">Value</span>
            </div>
            {unitTags.flatMap((tag) =>
              Array.from({ length: tag.length }).map((_, i) => {
                const addr = Number(tag.start) + i;
                const value = getRuntimeValue(
                  device.ip,
                  activeUnit,
                  activeFC,
                  addr
                );
                const isEven = i % 2 == 0;
                return (
                  <div
                    key={`${tag.unitId}-${tag.fc}-${addr}`}
                    className={`grid grid-cols-2 px-4 py-2 odd:bg-base-200 cursor-pointer ${
                      isEven ? "bg-base-200" : "bg-base-100"
                    } hover:bg-primary/10 transition`}
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
                    <span>{addr}</span>
                    <span className="text-blue-400 text-center ">{value}</span>
                  </div>
                );
              })
            )}
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
