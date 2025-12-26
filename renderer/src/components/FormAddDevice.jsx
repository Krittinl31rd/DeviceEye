import React from "react";

const FormAddDevice = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label htmlFor="" className="label">
          IP:
        </label>
        <input type="text" className="input input-sm" />
      </div>
      <div>
        <label htmlFor="" className="label">
          Port:
        </label>
        <input type="text" className="input input-sm" />
      </div>

      <div className="col-span-2 grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="" className="label">
            Unit ID:
          </label>
          <input type="number" className="input input-sm" />
        </div>
        <div>
          <label htmlFor="" className="label">
            FC:
          </label>
          <input type="number" className="input input-sm" />
        </div>
        <div>
          <label htmlFor="" className="label">
            Start:
          </label>
          <input type="number" className="input input-sm" />
        </div>
        <div>
          <label htmlFor="" className="label">
            Length:
          </label>
          <input type="number" className="input input-sm" />
        </div>
        <div>
          <label htmlFor="" className="label">
            Interval(ms):
          </label>
          <input type="number" className="input input-sm" />
        </div>
        <div>
          <label htmlFor="" className="label">
            Enabled:
          </label>
          <select name="" id="" className="select select-sm">
            <option value={true}>Enabled</option>
            <option value={false}>Disabled</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FormAddDevice;
