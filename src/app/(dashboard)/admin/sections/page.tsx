import { getCurrentAdmin } from "@/lib/auth";
import SectionHeader from "@/modules/admin/section/ui/components/SectionHeader";
import SectionView from "@/modules/admin/section/ui/views/SectionView";

export default async function page() {
  const user = await getCurrentAdmin();
  return (
    <>
      <SectionHeader />
      <SectionView />
    </>
  );
}
