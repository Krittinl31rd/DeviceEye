import React, { useState } from "react";

const MAX_TAGS = 4;

const FormAddDevice = ({ setFormDevice, formDevice }) => {
  const handleDeviceChange = (e) => {
    const { name, value } = e.target;
    setFormDevice((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (index, field, value) => {
    const tags = [...formDevice.tags];
    tags[index][field] = value;
    setFormDevice((prev) => ({ ...prev, tags }));
  };

  const addTag = () => {
    if (formDevice.tags.length >= MAX_TAGS) return;

    setFormDevice((prev) => ({
      ...prev,
      tags: [
        ...prev.tags,
        {
          unitId: "",
          fc: "",
          start: "",
          length: "",
          interval: 1000,
          enabled: true,
        },
      ],
    }));
  };

  const removeTag = (index) => {
    if (formDevice.tags.length === 1) return;

    setFormDevice((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Device */}
      <div>
        <label className="label">IP</label>
        <input
          name="ip"
          value={formDevice.ip}
          onChange={handleDeviceChange}
          className="input input-sm"
        />
      </div>

      <div>
        <label className="label">Port</label>
        <input
          name="port"
          type="number"
          value={formDevice.port}
          onChange={handleDeviceChange}
          className="input input-sm"
        />
      </div>

      {/* Tags */}
      <div className="col-span-2 space-y-3">
        {/* Add */}
        <button
          type="button"
          onClick={addTag}
          disabled={formDevice.tags.length >= MAX_TAGS}
          className="btn btn-sm btn-outline"
        >
          + Add Tag ({formDevice.tags.length}/{MAX_TAGS})
        </button>
        {formDevice.tags.map((tag, idx) => (
          <div
            key={idx}
            className="grid grid-cols-6 gap-2 border rounded p-2 relative"
          >
            <div>
              <label className="label">Unit ID</label>
              <input
                type="number"
                value={tag.unitId}
                onChange={(e) => handleTagChange(idx, "unitId", e.target.value)}
                className="input input-sm"
              />
            </div>

            <div>
              <label className="label">FC</label>
              <input
                type="number"
                value={tag.fc}
                min={1}
                max={4}
                onChange={(e) => handleTagChange(idx, "fc", e.target.value)}
                className="input input-sm"
              />
            </div>

            <div>
              <label className="label">Start</label>
              <input
                type="number"
                value={tag.start}
                onChange={(e) => handleTagChange(idx, "start", e.target.value)}
                className="input input-sm"
              />
            </div>

            <div>
              <label className="label">Length</label>
              <input
                type="number"
                value={tag.length}
                onChange={(e) => handleTagChange(idx, "length", e.target.value)}
                className="input input-sm"
              />
            </div>

            <div>
              <label className="label">Interval</label>
              <input
                type="number"
                value={tag.interval}
                onChange={(e) =>
                  handleTagChange(idx, "interval", e.target.value)
                }
                className="input input-sm"
              />
            </div>

            <div>
              <label className="label">Enabled</label>
              <select
                value={tag.enabled}
                onChange={(e) =>
                  handleTagChange(idx, "enabled", e.target.value === "true")
                }
                className="select select-sm"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            {/* Remove */}
            {formDevice.tags.length > 1 && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="btn btn-xs btn-error absolute -top-2 -right-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormAddDevice;
