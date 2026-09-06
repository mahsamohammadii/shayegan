import { Suspense } from "react";
import Product from "@/components/product/Product";
import { getProductBySlug } from "@/lib/api/products";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  let product = null;
  try {
    if (slug) {
      product = await getProductBySlug(slug);
    }
  } catch (err) {
    console.error("Error fetching product metadata for slug:", slug, err);
  }

  const nameFa = product?.name?.fa || product?.name?.en || "شایگان دیزاین";
  
  // Extract Persian description and convert HTML to plain text
  const descRaw = typeof product?.description === 'object'
    ? (product?.description?.fa || product?.description?.en || "")
    : (product?.description || "");
  const descText = descRaw ? descRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : "تولید و عرضه مبلمان باکیفیت شایگان دیزاین";

  // First image URL
  const firstImg = product?.images?.[0];
  const imageUrl = typeof firstImg === 'string'
    ? firstImg
    : (firstImg?.url || firstImg?.thumbnailUrl || firstImg?.renditions?.[0]?.url || "https://shayegandesign.com/images/logo.png");

  const canonicalUrl = `https://shayegandesign.com/product/${slug}`;

  return {
    title: nameFa,
    description: descText,
    robots: "index, follow",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: nameFa,
      description: descText,
      url: canonicalUrl,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
    },
    other: {
      meta_canonical: canonicalUrl,
      meta_ogurl: canonicalUrl,
      meta_ogimage: imageUrl,
      meta_title: nameFa,
      meta_ogtitle: nameFa,
      meta_robots: "index, follow",
      meta_description: descText,
      meta_ogdescription: descText,
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  let product = null;
  try {
    if (slug) {
      product = await getProductBySlug(slug);
    }
  } catch (e) {}

  const nameFa = product?.name?.fa || product?.name?.en || "شایگان دیزاین";
  const descRaw = typeof product?.description === 'object'
    ? (product?.description?.fa || product?.description?.en || "")
    : (product?.description || "");
  const descText = descRaw ? descRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : "تولید و عرضه مبلمان باکیفیت شایگان دیزاین";

  const firstImg = product?.images?.[0];
  const imageUrl = typeof firstImg === 'string'
    ? firstImg
    : (firstImg?.url || firstImg?.thumbnailUrl || firstImg?.renditions?.[0]?.url || "https://shayegandesign.com/images/logo.png");

  const canonicalUrl = `https://shayegandesign.com/product/${slug}`;

  return (
    <>
      <head>
        <title>{nameFa}</title>
        <meta name="title" content={nameFa} />
        <meta name="meta_title" content={nameFa} />
        <meta property="og:title" content={nameFa} />
        <meta name="meta_ogtitle" content={nameFa} />

        <meta name="description" content={descText} />
        <meta name="meta_description" content={descText} />
        <meta property="og:description" content={descText} />
        <meta name="meta_ogdescription" content={descText} />

        <link rel="canonical" href={canonicalUrl} />
        <meta name="meta_canonical" content={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="meta_ogurl" content={canonicalUrl} />

        <meta property="og:image" content={imageUrl} />
        <meta name="meta_ogimage" content={imageUrl} />

        <meta name="robots" content="index, follow" />
        <meta name="meta_robots" content="index, follow" />
      </head>
      <div className="w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <Product slugParam={slug} />
        </Suspense>
      </div>
    </>
  );
}

