import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, X } from 'lucide-react';
import { OperatingArea } from '../../types/index';
import { Input } from '../common/CustomInput';
import { Button } from '../common/CustomButton';

interface OperatingAreaFormProps {
  operatingAreas: OperatingArea[];
  onAreaChange: (index: number, field: keyof OperatingArea, value: string) => void;
  onAddArea: () => void;
  onRemoveArea: (index: number) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const OperatingAreaForm: React.FC<OperatingAreaFormProps> = ({
  operatingAreas,
  onAreaChange,
  onAddArea,
  onRemoveArea
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-slate-900">
            Preferred Operating Areas
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddArea}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Area</span>
        </Button>
      </div>

      <div className="space-y-6">
        {operatingAreas.map((area, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-slate-50 border border-slate-200 rounded-xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  State *
                </label>
                <select
                  value={area.state}
                  onChange={(e) => onAreaChange(index, 'state', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors duration-200"
                  required
                >
                  <option value="">Select a state</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <Input
                label="District"
                value={area.district}
                onChange={(value) => onAreaChange(index, 'district', value)}
                placeholder="Enter district name"
                required
              />

              {/* Place */}
              <Input
                label="Place"
                value={area.place}
                onChange={(value) => onAreaChange(index, 'place', value)}
                placeholder="Enter place/city name"
                required
              />
            </div>

            {/* Remove button */}
            {operatingAreas.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveArea(index)}
                className="absolute top-4 right-4 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Adding multiple operating areas increases your visibility to customers in those regions.
        </p>
      </div>
    </motion.div>
  );
};