// This page combines the previous Feed and Discover features into one Social tab.
import FeedPage from '../feed/page';
import DiscoverPage from '../discover/page';

export default function SocialPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <FeedPage />
      <DiscoverPage />
    </div>
  );
}
