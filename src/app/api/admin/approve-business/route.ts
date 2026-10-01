import { reviewBusiness } from '@/lib/server/reviewBusiness';

export async function POST(req: Request) {
    return reviewBusiness(req, 'approve');
}
