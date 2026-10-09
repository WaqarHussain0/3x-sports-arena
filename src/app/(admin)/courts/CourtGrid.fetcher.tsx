import { LandPlot } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CourtGrid } from "@/components/courts/CourtGrid";
import { connectDB } from "@/lib/db";
import { listCourtsPage } from "@/services/court.service";

interface ICourtGridFetcherProps {
  page: number;
  search: string;
  archived: boolean;
}

/** Server Component: loads one page of courts from the DB and renders the card grid. */
const CourtGridFetcher = async ({
  page,
  search,
  archived,
}: ICourtGridFetcherProps) => {
  await connectDB();
  const { items, limit, total } = await listCourtsPage({
    search,
    includeArchived: archived,
    page,
  });

  if (!items.length) {
    return (
      <EmptyState
        icon={LandPlot}
        title={
          search
            ? "No matches"
            : total > 0
              ? "This page is empty"
              : "No courts yet"
        }
        description={
          search
            ? `No courts match “${search}”.`
            : total > 0
              ? undefined
              : "Add your first court with “Add Court” to start taking bookings."
        }
      />
    );
  }

  return (
    <CourtGrid
      courts={items}
      filters={{ search, archived }}
      page={page}
      limit={limit}
      total={total}
    />
  );
};

export default CourtGridFetcher;
