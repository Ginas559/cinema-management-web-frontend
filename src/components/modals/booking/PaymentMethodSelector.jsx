import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, DollarSign } from 'lucide-react';

export default function PaymentMethodSelector({ onSelectPaymentMethod, disabled = false }) {
  const [selectedMethod, setSelectedMethod] = useState('CASH');

  const paymentMethods = [
    {
      id: 'CASH',
      name: 'Tiền mặt',
      icon: <Banknote className="w-6 h-6" />,
      description: 'Thanh toán bằng tiền mặt'
    },
    {
      id: 'CREDIT',
      name: 'Thẻ tín dụng',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Visa, Mastercard, JCB'
    },
    {
      id: 'DEBIT',
      name: 'Thẻ ATM',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Thẻ ghi nợ nội địa'
    },
    {
      id: 'MOMO',
      name: 'MoMo',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'Ví điện tử MoMo'
    }
  ];

  const handleSelect = (methodId) => {
    setSelectedMethod(methodId);
    onSelectPaymentMethod(methodId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        💳 Chọn phương thức thanh toán
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleSelect(method.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                ${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'}
              `}>
                {method.icon}
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">
                  {method.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {method.description}
                </div>
              </div>
              
              {selectedMethod === method.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Lưu ý:</strong> Phương thức thanh toán này chỉ áp dụng cho đặt vé tại quầy. 
          Khách hàng sẽ thanh toán trực tiếp với nhân viên.
        </p>
      </div>
    </div>
  );
}