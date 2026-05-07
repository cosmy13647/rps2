import { createOrder } from '../api/orderApi';
import { getTodayRevenue } from '../api/revenueApi';
import { payReceipt, markPrinted } from '../api/receiptApi';

const usePOS = () => {
    return {
        createOrder,
        getTodayRevenue,
        payReceipt,
        markPrinted
    };
};

export default usePOS;
