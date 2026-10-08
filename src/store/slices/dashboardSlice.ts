import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DashboardRangeType } from '@/lib/constants';
import { currentMonthPkt, todayPkt } from '@/lib/time';
import type { DashboardQuery } from '@/types';

export interface DashboardFilterState {
  rangeType: DashboardRangeType;
  month: string; // YYYY-MM
  year: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

// Lazy so the defaults reflect "now" whenever a store is created, not when the module loaded.
const initialState = (): DashboardFilterState => {
  const month = currentMonthPkt();
  return {
    rangeType: 'monthly',
    month,
    year: Number(month.slice(0, 4)),
    from: `${month}-01`,
    to: todayPkt(),
  };
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setRangeType(state, action: PayloadAction<DashboardRangeType>) {
      state.rangeType = action.payload;
    },
    setMonth(state, action: PayloadAction<string>) {
      state.month = action.payload;
    },
    setYear(state, action: PayloadAction<number>) {
      state.year = action.payload;
    },
    setCustomRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.from = action.payload.from;
      state.to = action.payload.to;
    },
  },
});

export function selectDashboardQuery(state: DashboardFilterState): DashboardQuery {
  if (state.rangeType === 'yearly') return { range: 'yearly', year: state.year };
  if (state.rangeType === 'custom') return { range: 'custom', from: state.from, to: state.to };
  return { range: 'monthly', month: state.month };
}

export const { setRangeType, setMonth, setYear, setCustomRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;
