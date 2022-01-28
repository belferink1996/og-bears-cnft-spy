import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import toHex from '../functions/toHex'
import getImageFromIPFS from '../functions/getImageFromIPFS'
import { Typography } from '@mui/material'
import Loading from './Loading'
import ListItem from './ListItem'
import { BEARS_POLICY_ID } from '../constants/policy-ids'

function Listings({ title = 'Recently Sold', sold = true }) {
  const { blockfrostData, getCnftListed, getCnftSold, getJpgListed, getJpgSold } = useData()
  const [data, setData] = useState([])

  const getCnftItem = (item) => {
    const assetId = `${BEARS_POLICY_ID}${toHex(item.assets[0].assetId)}`
    const {
      onchain_metadata: { name, image },
    } = blockfrostData.assets.find(({ asset }) => asset === assetId)

    return {
      assetId,
      name,
      price: item.price / 1000000,
      imageUrl: getImageFromIPFS(image),
      itemUrl: sold
        ? `https://pool.pm/${BEARS_POLICY_ID}.${item.assets[0].assetId}`
        : `https://cnft.io/token/${item._id}`,
      store: 'cnft.io',
      date: new Date(item.createdAt),
    }
  }

  const getJpgItem = (item) => {
    const assetId = item.asset
    const {
      onchain_metadata: { name, image },
    } = blockfrostData.assets.find(({ asset }) => asset === assetId)

    return {
      assetId,
      name,
      price: item.price_lovelace / 1000000,
      imageUrl: getImageFromIPFS(image),
      itemUrl: sold
        ? `https://pool.pm/${BEARS_POLICY_ID}.${name.replace('BEAR', '')}`
        : `https://jpg.store/asset/${assetId}`,
      store: 'jpg.store',
      date: new Date(sold ? item.purchased_at : item.listed_at),
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const cnftItems = (sold ? await getCnftSold() : await getCnftListed()).map((item) =>
          getCnftItem(item),
        )
        const jpgItems = (sold ? await getJpgSold() : await getJpgListed()).map((item) => getJpgItem(item))
        const items = cnftItems.concat(jpgItems).sort((a, b) => new Date(b.date) - new Date(a.date))

        setData((prev) => {
          // if there is no pre-fetched data, just return the current fetched data
          if (!prev.length) return items
          // a verification method to add only new data to the front of the array
          const newItems = []
          for (const currentItem of items) {
            if (currentItem._id === prev[0]._id) break
            newItems.push(currentItem)
          }

          return [...newItems, ...prev]
        })
      } catch (error) {
        console.error(error)
      }
    })()
  }, []) // eslint-disable-line

  return (
    <div className='listings-container'>
      <Typography
        variant='h4'
        component='div'
        sx={{
          margin: '1rem 0',
          fontFamily: 'IndieFlower',
          fontWeight: 'bold',
          color: 'whitesmoke',
          textShadow: '-1px 1px 3px black',
        }}>
        {title}
      </Typography>

      <div className='scroll listings'>
        {data.length ? (
          data.map(({ assetId, name, price, imageUrl, itemUrl, store, date }) => (
            <ListItem
              key={`${store}-${sold ? 'sold' : 'listed'}-${assetId}-${date}`}
              name={name}
              price={price}
              imageSrc={imageUrl}
              itemUrl={itemUrl}
              spanArray={[store, `${sold ? 'Sold:' : 'Listed:'} ${new Date(date).toLocaleString()}`]}
            />
          ))
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}

export default Listings