export default function PrintReceipt({ receipt }) {
    if (!receipt) return null;

    const date = new Date(receipt.created_at);
    const dateStr = date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

    return (
        <div id="print-receipt" className="hidden print:block font-mono text-black bg-white p-4 w-72 text-sm">
            <div className="text-center mb-2">
                <p>=====================================</p>
                <p className="font-bold">RESTO POS</p>
                <p>SALES RECEIPT</p>
                <p>=====================================</p>
            </div>

            <p>Receipt No : {receipt.receipt_number}</p>
            <p>Table      : {receipt.table_number}</p>
            <p>Waiter     : {receipt.waiter_name}</p>
            <p>Date       : {dateStr}</p>
            <p>Time       : {timeStr}</p>

            <p>-------------------------------------</p>
            <p>Item              Qty   Price   Total</p>
            <p>-------------------------------------</p>

            {receipt.items?.map((item, i) => (
                <p key={i}>
                    {item.meal_name.padEnd(18).slice(0, 18)}
                    {String(item.quantity).padStart(3)}
                    {String(item.unit_price).padStart(7)}
                    {String(item.line_total).padStart(7)}
                </p>
            ))}

            <p>-------------------------------------</p>
            <p>Subtotal                 KES {receipt.subtotal}</p>
            {receipt.amount_paid && (
                <>
                    <p>Amount Paid              KES {receipt.amount_paid}</p>
                    <p>Change                   KES {receipt.change_given}</p>
                    <p>Payment: {receipt.payment_method}</p>
                </>
            )}
            <div className="text-center mt-2">
                <p>=====================================</p>
                <p>Thank You!</p>
                <p>Visit Again 😊</p>
                <p>=====================================</p>
            </div>
        </div>
    );
}