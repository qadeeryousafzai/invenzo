import { MarketplaceSearch } from "@/components/marketplace/marketplace-search";

export const metadata = { title: "Discover local products", description: "Search products, branch availability, and pickup or delivery options from verified local businesses." };

export default function MarketplacePage() {
  return <MarketplaceSearch />;
}
