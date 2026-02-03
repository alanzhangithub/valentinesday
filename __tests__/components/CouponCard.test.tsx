import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
      <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

interface Coupon {
  id: string
  title: string
  description: string
  createdBy: 'meedo' | 'beedo'
  expiresAt?: string
  isRedeemed: boolean
  redeemedAt?: string
  category?: 'food' | 'activity' | 'service' | 'special'
}

interface CouponCardProps {
  coupon: Coupon
  onRedeem?: (coupon: Coupon) => void | Promise<void>
  loading?: boolean
  currentUser?: 'meedo' | 'beedo'
}

// placeholder component - replace with actual import
const CouponCard: React.FC<CouponCardProps> = ({
  coupon,
  onRedeem,
  loading = false,
  currentUser = 'beedo',
}) => {
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
  const canRedeem = !coupon.isRedeemed && !isExpired && coupon.createdBy !== currentUser

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div
      data-testid={`coupon-card-${coupon.id}`}
      className={`coupon-card ${coupon.isRedeemed ? 'redeemed' : ''} ${isExpired ? 'expired' : ''}`}
    >
      <div className="coupon-header">
        <h3 data-testid="coupon-title">{coupon.title}</h3>
        {coupon.category && (
          <span data-testid="coupon-category" className="category-badge">
            {coupon.category}
          </span>
        )}
      </div>

      <p data-testid="coupon-description">{coupon.description}</p>

      <div className="coupon-meta">
        <span data-testid="coupon-creator">Created by: {coupon.createdBy}</span>

        {coupon.expiresAt && (
          <span data-testid="coupon-expiry">
            {isExpired ? 'Expired: ' : 'Expires: '}
            {formatDate(coupon.expiresAt)}
          </span>
        )}
      </div>

      {coupon.isRedeemed && coupon.redeemedAt && (
        <div data-testid="coupon-redeemed-info" className="redeemed-info">
          Redeemed on {formatDate(coupon.redeemedAt)}
        </div>
      )}

      {isExpired && !coupon.isRedeemed && (
        <div data-testid="coupon-expired-badge" className="expired-badge">
          This coupon has expired
        </div>
      )}

      <button
        data-testid="redeem-button"
        onClick={() => onRedeem?.(coupon)}
        disabled={!canRedeem || loading}
        className={`redeem-button ${!canRedeem ? 'disabled' : ''}`}
      >
        {loading ? 'Redeeming...' : coupon.isRedeemed ? 'Already Redeemed' : 'Redeem Coupon'}
      </button>
    </div>
  )
}

describe('CouponCard', () => {
  const mockCoupon: Coupon = {
    id: 'coupon-1',
    title: 'One Free Back Massage',
    description: 'Beedo gets a 30-minute back massage from Meedo',
    createdBy: 'meedo',
    expiresAt: '2026-12-31',
    isRedeemed: false,
    category: 'service',
  }

  const redeemedCoupon: Coupon = {
    ...mockCoupon,
    id: 'coupon-2',
    isRedeemed: true,
    redeemedAt: '2025-06-15',
  }

  const expiredCoupon: Coupon = {
    ...mockCoupon,
    id: 'coupon-3',
    expiresAt: '2024-01-01',
  }

  describe('render states', () => {
    it('renders coupon information correctly', () => {
      render(<CouponCard coupon={mockCoupon} />)

      expect(screen.getByTestId('coupon-title')).toHaveTextContent('One Free Back Massage')
      expect(screen.getByTestId('coupon-description')).toHaveTextContent('Beedo gets a 30-minute back massage from Meedo')
      expect(screen.getByTestId('coupon-creator')).toHaveTextContent('Created by: meedo')
    })

    it('renders category badge when provided', () => {
      render(<CouponCard coupon={mockCoupon} />)

      expect(screen.getByTestId('coupon-category')).toHaveTextContent('service')
    })

    it('does not render category badge when not provided', () => {
      const couponWithoutCategory = { ...mockCoupon, category: undefined }
      render(<CouponCard coupon={couponWithoutCategory} />)

      expect(screen.queryByTestId('coupon-category')).not.toBeInTheDocument()
    })

    it('renders expiry date when provided', () => {
      render(<CouponCard coupon={mockCoupon} />)

      expect(screen.getByTestId('coupon-expiry')).toBeInTheDocument()
      expect(screen.getByTestId('coupon-expiry')).toHaveTextContent(/expires/i)
    })

    it('does not render expiry when not provided', () => {
      const couponWithoutExpiry = { ...mockCoupon, expiresAt: undefined }
      render(<CouponCard coupon={couponWithoutExpiry} />)

      expect(screen.queryByTestId('coupon-expiry')).not.toBeInTheDocument()
    })

    it('renders redeemed state correctly', () => {
      render(<CouponCard coupon={redeemedCoupon} />)

      expect(screen.getByTestId('coupon-redeemed-info')).toBeInTheDocument()
      expect(screen.getByTestId('coupon-redeemed-info')).toHaveTextContent(/redeemed on/i)
      expect(screen.getByTestId('redeem-button')).toHaveTextContent('Already Redeemed')
      expect(screen.getByTestId('redeem-button')).toBeDisabled()
    })

    it('renders expired state correctly', () => {
      render(<CouponCard coupon={expiredCoupon} />)

      expect(screen.getByTestId('coupon-expired-badge')).toBeInTheDocument()
      expect(screen.getByTestId('coupon-expired-badge')).toHaveTextContent(/expired/i)
      expect(screen.getByTestId('redeem-button')).toBeDisabled()
    })

    it('renders loading state on button', () => {
      render(<CouponCard coupon={mockCoupon} loading={true} />)

      expect(screen.getByTestId('redeem-button')).toHaveTextContent('Redeeming...')
      expect(screen.getByTestId('redeem-button')).toBeDisabled()
    })
  })

  describe('redeem button behavior', () => {
    it('calls onRedeem when button is clicked', () => {
      const handleRedeem = jest.fn()
      render(<CouponCard coupon={mockCoupon} onRedeem={handleRedeem} />)

      fireEvent.click(screen.getByTestId('redeem-button'))

      expect(handleRedeem).toHaveBeenCalledTimes(1)
      expect(handleRedeem).toHaveBeenCalledWith(mockCoupon)
    })

    it('does not call onRedeem when coupon is already redeemed', () => {
      const handleRedeem = jest.fn()
      render(<CouponCard coupon={redeemedCoupon} onRedeem={handleRedeem} />)

      fireEvent.click(screen.getByTestId('redeem-button'))

      expect(handleRedeem).not.toHaveBeenCalled()
    })

    it('does not call onRedeem when coupon is expired', () => {
      const handleRedeem = jest.fn()
      render(<CouponCard coupon={expiredCoupon} onRedeem={handleRedeem} />)

      fireEvent.click(screen.getByTestId('redeem-button'))

      expect(handleRedeem).not.toHaveBeenCalled()
    })

    it('does not call onRedeem when loading', () => {
      const handleRedeem = jest.fn()
      render(<CouponCard coupon={mockCoupon} onRedeem={handleRedeem} loading={true} />)

      fireEvent.click(screen.getByTestId('redeem-button'))

      expect(handleRedeem).not.toHaveBeenCalled()
    })

    it('disables redeem for coupons created by current user', () => {
      const handleRedeem = jest.fn()
      const meedoCoupon = { ...mockCoupon, createdBy: 'meedo' as const }
      render(<CouponCard coupon={meedoCoupon} onRedeem={handleRedeem} currentUser="meedo" />)

      expect(screen.getByTestId('redeem-button')).toBeDisabled()
      fireEvent.click(screen.getByTestId('redeem-button'))
      expect(handleRedeem).not.toHaveBeenCalled()
    })

    it('enables redeem for coupons created by other user', () => {
      const handleRedeem = jest.fn()
      const meedoCoupon = { ...mockCoupon, createdBy: 'meedo' as const }
      render(<CouponCard coupon={meedoCoupon} onRedeem={handleRedeem} currentUser="beedo" />)

      expect(screen.getByTestId('redeem-button')).not.toBeDisabled()
    })
  })

  describe('expiry display', () => {
    it('shows "Expires:" for future dates', () => {
      const futureCoupon = { ...mockCoupon, expiresAt: '2030-12-31' }
      render(<CouponCard coupon={futureCoupon} />)

      expect(screen.getByTestId('coupon-expiry')).toHaveTextContent(/^Expires:/i)
    })

    it('shows "Expired:" for past dates', () => {
      render(<CouponCard coupon={expiredCoupon} />)

      expect(screen.getByTestId('coupon-expiry')).toHaveTextContent(/^Expired:/i)
    })
  })

  describe('coupon categories', () => {
    const categories: Array<Coupon['category']> = ['food', 'activity', 'service', 'special']

    categories.forEach((category) => {
      it(`renders ${category} category correctly`, () => {
        const categoryCoupon = { ...mockCoupon, category }
        render(<CouponCard coupon={categoryCoupon} />)

        expect(screen.getByTestId('coupon-category')).toHaveTextContent(category!)
      })
    })
  })

  describe('async redeem handler', () => {
    it('handles async onRedeem callback', async () => {
      const handleRedeem = jest.fn().mockResolvedValue(undefined)
      render(<CouponCard coupon={mockCoupon} onRedeem={handleRedeem} />)

      fireEvent.click(screen.getByTestId('redeem-button'))

      await waitFor(() => {
        expect(handleRedeem).toHaveBeenCalled()
      })
    })
  })
})
