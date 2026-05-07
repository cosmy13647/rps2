import React, { useState } from 'react';
import usePOS from '../hooks/usePOS';

const CashierPage = () => {
    const { createOrder, payReceipt, markPrinted } = usePOS();
    const [lastReceiptId, setLastReceiptId] = useState(null);

    const handleCreateOrder = async (orderData) => {
        try {
            const data = await createOrder(orderData);
            console.log('Order created:', data);
            // The backend returns { order, receipt }
            if (data && data.receipt) {
                setLastReceiptId(data.receipt._id);
            }
            return data;
        } catch (error) {
            console.error('Failed to create order:', error);
        }
    };

    const handlePayReceipt = async (receiptId) => {
        try {
            const result = await payReceipt(receiptId, { role: 'cashier' });
            console.log('Receipt paid:', result);
            return result;
        } catch (error) {
            console.error('Failed to pay receipt:', error);
        }
    };

    const handleMarkPrinted = async (receiptId) => {
        try {
            const result = await markPrinted(receiptId);
            console.log('Receipt marked as printed:', result);
            return result;
        } catch (error) {
            console.error('Failed to mark receipt as printed:', error);
        }
    };

    const handleTestCreateOrder = () => {
        const sampleOrder = {
            tableNumber: '5',
            waiterName: 'Test Waiter',
            items: [
                { meal: 'Coffee', price: 5, qty: 2, total: 10 },
                { meal: 'Cake', price: 10, qty: 1, total: 10 }
            ],
            subtotal: 20
        };
        handleCreateOrder(sampleOrder);
    };

    const handleTestPayReceipt = () => {
        if (!lastReceiptId) {
            console.error('No receipt ID available. Please create an order first.');
            alert('Please create an order first to get a valid receipt ID.');
            return;
        }
        handlePayReceipt(lastReceiptId);
    };

    const handleTestMarkPrinted = () => {
        if (!lastReceiptId) {
            console.error('No receipt ID available. Please create an order first.');
            alert('Please create an order first to get a valid receipt ID.');
            return;
        }
        handleMarkPrinted(lastReceiptId);
    };

    return (
        <div>
            <h1>Cashier Page</h1>
            <p>Ready for order processing.</p>
            {lastReceiptId && <p>Last Receipt ID: {lastReceiptId}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleTestCreateOrder}>
                    1. Test Create Order
                </button>
                <button onClick={handleTestPayReceipt}>
                    2. Test Pay Receipt
                </button>
                <button onClick={handleTestMarkPrinted}>
                    3. Test Mark Printed
                </button>
            </div>
        </div>
    );
};

export default CashierPage;
