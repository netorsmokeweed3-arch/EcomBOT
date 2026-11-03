import { Order } from '../types/order';

class OrderStore {
  private manualAddedOrders: Order[] = [];
  private completedOrders: Order[] = [];
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('[OrderStoreListenerError]', err);
      }
    });
  }

  public getManualOrders(): Order[] {
    return this.manualAddedOrders;
  }

  public getCompletedOrders(): Order[] {
    return this.completedOrders;
  }

  // Дозволяє додавати те саме замовлення нескінченну кількість разів, генеруючи унікальний ID для кожної копії
  public addManualOrder(order: Order) {
    if (!order) return;
    
    const uniqueId = `${order.id || 'order'}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    const formattedOrder = {
      ...order,
      id: uniqueId,
      createdAt: order.createdAt || new Date().toISOString(),
      status: order.status || 'new',
    };

    this.manualAddedOrders = [formattedOrder, ...this.manualAddedOrders];
    this.notify();
  }

  public completeOrder(order: Order) {
    if (!order) return;
    const completed = { 
      ...order, 
      status: 'completed', 
      createdAt: order.createdAt || new Date().toISOString() 
    };

    this.completedOrders = [completed, ...this.completedOrders];
    
    // Видаляємо з ручних / активних за цим конкретним унікальним ID
    this.manualAddedOrders = this.manualAddedOrders.filter(o => o.id !== order.id);
    this.notify();
  }

  public deleteCompletedOrder(id: string) {
    if (!id) return;
    this.completedOrders = this.completedOrders.filter(o => o.id !== id);
    this.notify();
  }

  public deleteManualOrder(id: string) {
    if (!id) return;
    this.manualAddedOrders = this.manualAddedOrders.filter(o => o.id !== id);
    this.notify();
  }
}

export const orderStore = new OrderStore();