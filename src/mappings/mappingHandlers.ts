import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {Transfer} from "../types";
import {Balance} from "@polkadot/types/interfaces";
import maxmind, {Reader} from "maxmind";

const dbs="/usr/local/lib/node_modules/geolite2-redist/dbs";

async function asnLookupOpen(): Promise<Reader<any>>{
    return maxmind.open(dbs+"/GeoLite2-ASN.mmdb");
}

async function contryLookupOpen(): Promise<Reader<any>>{
    return maxmind.open(dbs+"/GeoLite2-Country.mmdb");
}

export async function handleTransfer(event: SubstrateEvent): Promise<void> {
    const asnLookup= await asnLookupOpen();
    const countryLookup= await contryLookupOpen();
    const from = event.event.data[0];
    const to = event.event.data[1];
    const amount = event.event.data[2];

    const transfer = new Transfer(
        `${event.block.block.header.number.toNumber()}-${event.idx}`
    );

    transfer.blockNumber=event.block.block.header.number.toBigInt();
    transfer.from=from.toString();
    transfer.to=to.toString();
    transfer.amount=(amount as Balance).toBigInt();
    transfer.asn=asnLookup.get('37.123.164.49').autonomous_system_number;
    transfer.country=countryLookup.get('37.123.164.49').country.iso_code;

    await transfer.save();
}


