
import { VendorsLocal } from './localAdapter';

// Export a singleton instance of the local data adapter.
// This allows the rest of the application to interact with vendor data
// through a consistent interface without needing to know the implementation details.
export const vendorsData = new VendorsLocal();
