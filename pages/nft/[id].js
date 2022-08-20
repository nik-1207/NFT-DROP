import Link from "next/link";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  useAddress,
  useDisconnect,
  useMetamask,
  useNFTDrop,
} from "@thirdweb-dev/react";

import { sanityClient, urlFor } from "../../sanity";
import { withRouter } from "next/router";

const NFTDropPage = ({ collection }) => {
  const [claimedSupply, setClaimedSupply] = React.useState(0);
  const [totalSupply, setTotalSupply] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [priceInEth, setPriceInEth] = React.useState("");

  const nftDrop = useNFTDrop(collection.address);
  const connectWithMetamask = useMetamask();
  const address = useAddress();
  const disconnect = useDisconnect();

  React.useEffect(() => {
    if (!nftDrop) return;
    const fetchNFTDropData = async () => {
      setLoading(true);
      const claimed = await nftDrop.getAllClaimed();
      const total = await nftDrop.totalSupply();
      const claimConditions = await nftDrop.claimConditions.getAll();

      setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue);
      setClaimedSupply(claimed.length);
      setTotalSupply(total);
      setLoading(false);
    };

    fetchNFTDropData();
  }, [nftDrop, setClaimedSupply, setTotalSupply, setLoading, setPriceInEth]);

  const mintNft = React.useCallback(() => {
    if (!nftDrop || !address) return;

    const quantity = 1;

    setLoading(true);
    const notification = toast.loading("Minting...", {
      style: {
        background: "white",
        color: "green",
        fontWeight: "bolder",
        fontSize: "17px",
        padding: "20px",
      },
    });

    nftDrop
      .claimTo(address, quantity)
      .then((tx) => {
        console.log(tx);
        toast("You Successfully Minted!", {
          duration: 8000,
          style: {
            background: "white",
            color: "green",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      })
      .catch((err) => {
        console.log(err);
        toast("Woops! Something went wrong!", {
          duration: 8000,
          style: {
            background: "red",
            color: "white",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      })
      .finally(() => {
        setLoading(false);
        toast.dismiss(notification);
      });
  }, [nftDrop, setLoading]);

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
      <Toaster position="bottom-center" />
      <div className="bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4">
        <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
          <div className="bg-gradient-to-br from-yellow-400 to-purple-600 p-2 rounded-xl">
            <img
              className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
              src={urlFor(collection.previewImage).url()}
              alt="ape nft"
            />
          </div>

          <div className="space-y-2 p-5 text-center">
            <h1 className="text-4xl font-bold text-white">
              {collection.nftCollectionName}
            </h1>
            <h2 className="text-xl text-gray-300">{collection.description} </h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-12 lg:col-span-6">
        <header className="flex items-center justify-between">
          <Link href="/">
            <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              The{" "}
              <span className="font-extrabold underline decoration-pink-600/50">
                Nik-1207
              </span>{" "}
              NFT Market place
            </h1>
          </Link>
          <button
            onClick={address ? disconnect : connectWithMetamask}
            className="rounded-full bg-rose-400 px-4 py-2 text-xs text-white lg:px-5 lg:py-3 lg:text-base"
          >
            {address ? "Sign Out" : "Sign In"}
          </button>
        </header>
        <hr className="my-2 border" />
        {address && (
          <p className="text-center text-sm text-rose-400">
            You&apos;re logged in with wallet {address.slice(0, 5)}...
            {address.slice(address.length - 5)}
          </p>
        )}
        <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-center">
          <img
            className="w-80 object-cover pb-10 lg:h-40"
            src={urlFor(collection.mainImage).url()}
            alt="apes collection"
          />
          <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold">
            The Nik-1207 NFT Drop website
          </h1>
          {loading ? (
            <p className="pt-2text-xl text-green-500">
              loading supply content ...
            </p>
          ) : (
            <p className="pt-2text-xl text-green-500">
              {claimedSupply} / {totalSupply.toString()} Nft&apos;s claimed
            </p>
          )}
          {loading && (
            <img
              className="h-80 w-80 object-contain"
              src={"https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"}
              alt={"loader"}
            />
          )}
        </div>
        <button
          onClick={mintNft}
          disabled={
            loading || claimedSupply === totalSupply.toNumber() || !address
          }
          className="h-16 w-full bg-red-600 text-white rounded-full mt-10 font-bold disabled:bg-gray-400"
        >
          {loading ? (
            <>loading</>
          ) : claimedSupply === totalSupply.toNumber() ? (
            <>SOLD OUT</>
          ) : !address ? (
            <>Sign In to MINT</>
          ) : (
            <span className="font-bold">Mint Nft {priceInEth} ETH</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NFTDropPage;

export const getServerSideProps = async ({ params }) => {
  const query = `*[_type=="collection" && slug.current == $id][0]{
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage {asset},
    previewImage {asset},
    slug {current},
    creator -> {
    _id,
    name,
    address,
    slug {current},
  },
  }`;

  const collection = await sanityClient.fetch(query, {
    id: params.id,
  });

  if (!collection) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: { collection },
    };
  }
};
