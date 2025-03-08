import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSession } from '../../contexts/SessionContext'
import { useApi } from '../../contexts/ApiContext'
import { useWebsocket } from '../../contexts/WebsocketContext'
import { useOrder } from '../../contexts/OrderContext'

/**
 * Component to manage payment option stripe behavior without UI component
 */
export const PaymentOptionStripe = (props) => {
  const {
    businessId,
    UIComponent,
    setCardList,
    gateway,
    onPaymentChange,
    paySelected,
    newCardAdded,
    paymethodSelectedInfo,
    paymethodV2Featured
  } = props

  const [{ token, user }] = useSession()
  const [, { changePaymethod }] = useOrder()
  const [ordering] = useApi()
  const socket = useWebsocket()
  /**
   * Contains and object to save cards, handle loading and error
   */
  const [cardsList, setCardsList] = useState({ cards: [], loading: true, error: null })
  /**
   * save stripe public key
   */
  const [publicKey, setPublicKey] = useState(props.publicKey)

  const [cardSelected, setCardSelected] = useState(null)
  const [cardDefault, setCardDefault] = useState(null)
  const [defaultCardSetActionStatus, setDefaultCardSetActionStatus] = useState({ loading: false, error: null })

  const requestState = {}

  const paymethodsWithoutSaveCards = ['credomatic']

  /**
   * method to get cards from API
   */
  const getCards = async () => {
    if (paymethodsWithoutSaveCards.includes(gateway)) {
      setCardsList({ cards: [], loading: false, error: null })
      setCardList({ cards: [], loading: false, error: null })
      return
    }
    setCardsList({ ...cardsList, loading: true })
    try {
      const source = {}
      requestState.paymentCards = source
      // The order of paymentCards params is businessId, userId. This sdk needs to be improved in the future,
      const { content: { result } } = await ordering.setAccessToken(token).paymentCards(businessId, user.id).get({ cancelToken: source })
      const defaultCard = result?.find(card => card.default || card?.id === newCardAdded?.paymentMethodId)
      if (defaultCard) {
        setCardDefault({
          id: defaultCard.id,
          type: 'card',
          card: {
            brand: defaultCard.brand,
            last4: defaultCard.last4,
            zipcode: defaultCard?.zipcode
          }
        })
      }
      setCardsList({
        ...cardsList,
        loading: false,
        cards: result
      })
      setCardList && setCardList({
        ...cardsList,
        loading: false,
        cards: result
      })
    } catch (error) {
      setCardsList({
        ...cardsList,
        loading: false,
        error
      })
      setCardList && setCardList({
        ...cardsList,
        loading: false,
        error
      })
    }
  }

  /**
   * method to get cards from API
   */
  const deleteCard = async (card) => {
    try {
      if (paymethodsWithoutSaveCards.includes(gateway)) {
        setCardsList({ cards: [], loading: false, error: null })
        setCardSelected(null)
        setCardList({ cards: [], loading: false, error: null })
        return
      }
      // The order of paymentCards params is businessId, userId, cardId. This sdk needs to be improved in the future,
      const { content: { error } } = await ordering.paymentCards(-1, user.id, card.id).delete()
      if (!error) {
        cardsList.cards = cardsList.cards.filter(_card => _card.id !== card.id)
        setCardsList({
          ...cardsList
        })
        if (paySelected?.data?.id === card?.id) {
          setCardSelected(null)
          onPaymentChange && onPaymentChange(null)
        }
        getCards()
      }
    } catch (error) {
      console.error(error.message)
    }
  }
  /**
   * method to set card as default
   */
  const setDefaultCard = async (card) => {
    if (paymethodsWithoutSaveCards.includes(gateway)) return
    try {
      setDefaultCardSetActionStatus({ ...defaultCardSetActionStatus, loading: true })
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        },
        body: JSON.stringify({
          business_id: businessId,
          user_id: user.id,
          card_id: card.id
        })
      }
      const functionFetch = `${ordering.root}/payments/stripe/cards/default`
      const response = await fetch(functionFetch, requestOptions)
      const content = await response.json()
      if (!content.error) {
        setCardDefault({
          id: card.id,
          type: 'card',
          card: {
            brand: card.brand,
            last4: card.last4,
            zipcode: card.zipcode
          }
        })
        setDefaultCardSetActionStatus({ loading: false, error: null })
      } else {
        setDefaultCardSetActionStatus({ loading: false, error: content.result })
      }
    } catch (error) {
      setDefaultCardSetActionStatus({ loading: false, error })
    }
  }
  /**
   * Method to get stripe credentials from API
   */
  const getCredentials = async () => {
    if (paymethodsWithoutSaveCards.includes(gateway)) return
    try {
      const { content: { result } } = await ordering.setAccessToken(token).paymentCards().getCredentials()
      setPublicKey(result.publishable)
    } catch (error) {
      console.error(error.message)
    }
  }

  const handleCardClick = (card) => {
    if (paymethodsWithoutSaveCards.includes(gateway)) {
      setCardSelected(card)
    } else {
      setCardSelected({
        id: card.id,
        type: 'card',
        card: {
          brand: card.brand,
          last4: card.last4,
          zipcode: card.zipcode
        }
      })
    }
  }

  const handleNewCard = (card) => {
    cardsList.cards.unshift(card)
    setCardsList({ ...cardsList, card })
    if (paymethodsWithoutSaveCards.includes(gateway)) {
      setCardList({ ...cardsList, card })
    }
    handleCardClick(card)
  }

  const getPaymentUserCards = async () => {
    const where = {
      conditions: [{
        attribute: 'user_paymethod',
        conditions: [{
          attribute: 'business_id',
          value: {
            condition: '=',
            value: businessId
          }
        }],
        operator: 'AND'
      }]
    }
    try {
      const response = await fetch(`${ordering.root}/users/${user.id}/paymethods/${paymethodSelectedInfo?.id}/paymethods?where=${JSON.stringify(where)}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const content = await response.json()
      if (!content.error) {
        const cards = content.result.map(card => ({
          id: card.id,
          type: card.type,
          last4: card?.type_data?.last4,
          brand: card?.type_data?.brand,
          card_token: card.external_id
        }))
        setCardsList({
          ...cardsList,
          loading: false,
          cards
        })
        setCardList && setCardList({
          ...cardsList,
          loading: false,
          cards
        })
      }
    } catch (error) {
      setCardsList({
        ...cardsList,
        loading: false,
        error
      })
      setCardList && setCardList({
        ...cardsList,
        loading: false,
        error
      })
    }
  }

  const deleteUserCard = async (card) => {
    try {
      const response = await fetch(`${ordering.root}/users/${user.id}/paymethods/${paymethodSelectedInfo?.id}/paymethods/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const content = await response.json()
      if (!content.error) {
        if (cardSelected?.id === card?.id) {
          setCardSelected(null)
          onPaymentChange && onPaymentChange({
            ...paymethodSelectedInfo,
            data: null
          })
          changePaymethod(businessId, paymethodSelectedInfo.id, '{}')
        }
        setCardsList({
          ...cardsList,
          cards: cardsList.cards.filter(c => c.id !== card.id)
        })
        setCardList && setCardList({
          ...cardsList,
          cards: cardsList.cards.filter(c => c.id !== card.id)
        })
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      paymethodV2Featured?.includes?.('get_cards') ? getPaymentUserCards() : getCards()
      if (!props.publicKey && !paymethodV2Featured) {
        getCredentials()
      }
    }
    return () => {
      if (requestState.paymentCards && requestState.paymentCards.cancel) {
        requestState.paymentCards.cancel()
      }
    }
  }, [token, businessId, paySelected?.data, paymethodV2Featured])

  useEffect(() => {
    if (newCardAdded) {
      getCards()
    }
  }, [JSON.stringify(newCardAdded)])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          cardSelected={cardSelected}
          cardDefault={cardDefault}
          cardsList={cardsList}
          setCardsList={setCardsList}
          handleCardClick={handleCardClick}
          publicKey={publicKey}
          handleNewCard={handleNewCard}
          deleteCard={deleteCard}
          setDefaultCard={setDefaultCard}
          deleteUserCard={deleteUserCard}
          defaultCardSetActionStatus={defaultCardSetActionStatus}
          paymethodsWithoutSaveCards={paymethodsWithoutSaveCards}
        />
      )}
    </>
  )
}

PaymentOptionStripe.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * Business id to get cards from API
   */
  businessId: PropTypes.number.isRequired,
  /**
   * User id to pass in endpoint to get cards from API,
   */
  userId: PropTypes.number
}
