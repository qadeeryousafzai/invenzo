import { MarketplaceSearch } from "@/components/marketplace/marketplace-search";

export const metadata = { title: "Find products nearby", description: "Search available products at verified local businesses." };

export default function MarketplacePage() {
  return <MarketplaceSearch />;
}
