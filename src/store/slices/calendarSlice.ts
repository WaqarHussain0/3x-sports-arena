import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { addDaysStr, getWeekStart, todayPkt } from '@/lib/time';

export interface CalendarState {
  /** ISO date (YYYY-MM-DD, PKT) of the Monday of the visible week. */
  weekStart: string;
  courtFilter: 'all' | string;
  showCancelled: boolean;
}

const initialState = (): CalendarState => ({
  weekStart: getWeekStart(todayPkt()),
  courtFilter: 'all',
  showCancelled: false,
});

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    nextWeek(state) {
      state.weekStart = addDaysStr(state.weekStart, 7);
    },
    prevWeek(state) {
      state.weekStart = addDaysStr(state.weekStart, -7);
    },
    goToToday(state) {
      state.weekStart = getWeekStart(todayPkt());
    },
    goToDate(state, action: PayloadAction<string>) {
      state.weekStart = getWeekStart(action.payload);
    },
    setCourtFilter(state, action: PayloadAction<CalendarState['courtFilter']>) {
      state.courtFilter = action.payload;
    },
    setShowCancelled(state, action: PayloadAction<boolean>) {
      state.showCancelled = action.payload;
    },
  },
});

export const { nextWeek, prevWeek, goToToday, goToDate, setCourtFilter, setShowCancelled } = calendarSlice.actions;
export default calendarSlice.reducer;
