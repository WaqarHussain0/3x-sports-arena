import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CardGridSkeleton } from '@/components/shared/LoadingState';
import { COURTS_PAGE_SIZE } from '@/lib/constants';
import { parsePage } from '@/lib/url';
import CourtWrapper from './Court.wrapper';
import CourtGridFetcher from './CourtGrid.fetcher';

export const metadata: Metadata = { title: 'Courts' };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    archived?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { page = '1', search = '', archived } = await searchParams;

  return (
    <CourtWrapper>
      <Suspense fallback={<CardGridSkeleton count={COURTS_PAGE_SIZE} />}>
        <CourtGridFetcher page={parsePage(page)} search={search.trim()} archived={archived === 'true'} />
      </Suspense>
    </CourtWrapper>
  );
};

export default Page;
