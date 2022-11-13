import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  ItemBought as ItemBoughtEvent,
  ItemCanceled as ItemCanceledEvent,
  ItemListed as ItemListedEvent
} from "../generated/NftMarketplace/NftMarketplace"
import {ItemListed, ActiveItem, ItemBought, ItemCanceled} from "../generated/schema"

export function handleItemBought(event: ItemBoughtEvent): void {
  // ItemBoughtEvent: just the raw event
  // ItemBoughtObject: what we save

  // 1 - Checks if token was already bought
  // ItemBought & ActiveItem type comes from the pre-generated schema.ts (see above)
  // If the token was already bought, it should be found using this Id (see "new ItemBought()"" below)
  let itemBought = ItemBought.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  let activeItem = ActiveItem.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  // 2 - Creates a new entry if token never bought yet
  if(!itemBought) {
    itemBought = new ItemBought(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  }
  // 3 - Updates entry based on received event
  itemBought.buyer = event.params.buyer
  itemBought.nftAddress = event.params.nftAddress
  itemBought.tokenId = event.params.tokenId

  // Here, the active item entry is not deleted, we are simply
  // attributing it a buyer
  // "!" because there must be an active item in the list
  activeItem!.buyer = event.params.buyer

  itemBought.save()
  activeItem!.save()

}

export function handleItemCanceled(event: ItemCanceledEvent): void {
  let itemCanceled = ItemCanceled.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  let activeItem = ActiveItem.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  if(!itemCanceled) {
    itemCanceled = new ItemCanceled(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  }

  itemCanceled.seller = event.params.seller
  itemCanceled.nftAddress = event.params.nftAddress
  itemCanceled.tokenId = event.params.tokenId
  // This is called the "Dead Address"
  // It is used to decide if the item has been canceled
  // If the token is still listed, the address is "0x00...000"
  activeItem!.buyer = Address.fromString("0x000000000000000000000000000000000000dEaD")

  itemCanceled.save()
  activeItem!.save()

}

export function handleItemListed(event: ItemListedEvent): void {
  let itemListed = ItemListed.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  let activeItem = ActiveItem.load(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))

  if(!itemListed) {
    itemListed = new ItemListed(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  }
  if(!activeItem) {
    activeItem = new ActiveItem(getIdFromEventParams(event.params.tokenId, event.params.nftAddress))
  }
  itemListed.seller = event.params.seller
  activeItem.seller = event.params.seller

  itemListed.nftAddress = event.params.nftAddress
  activeItem.nftAddress = event.params.nftAddress

  itemListed.tokenId = event.params.tokenId
  activeItem.tokenId = event.params.tokenId

  itemListed.price = event.params.price
  activeItem.price = event.params.price

  activeItem.buyer = Address.fromString("0x0000000000000000000000000000000000000000")
  
  itemListed.save()
  activeItem.save()

}

// Each item with an entity needs a unique ID
// The "BigInt" & "Address" types are specific to The Graph
function getIdFromEventParams(tokenId: BigInt, NftAddress: Address): string {
  return tokenId.toHexString() + NftAddress.toHexString()
}