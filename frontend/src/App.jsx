import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [product, setProduct] = useState('Laptop');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Submitting order...');

    try {
      const response = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, quantity })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Order failed');

      setStatus(`Order successful: ${result.message}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Order System</h1>
        <p className="subtitle">Distributed microservice demo</p>

        <form onSubmit={handleSubmit}>
          <label>
            Product
            <input value={product} onChange={(e) => setProduct(e.target.value)} />
          </label>

          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div className="status-box">
          <strong>Status:</strong> {status}
        </div>
      </div>
    </div>
  );
}

export default App;
