export async function getFeedURL(bucket, region) {
  try {
    // Step 1: fetch latest.yml from the S3 root folder
    const latestYmlUrl = `https://${bucket}.s3.${region}.amazonaws.com/releases/latest.yml`;
    const res = await fetch(latestYmlUrl);
    if (!res.ok) throw new Error(`Failed to fetch latest.yml: ${res.statusText}`);
    const text = await res.text();

    // Step 2: extract version number from latest.yml
    const match = text.match(/version:\s*([\d.]+)/);
    if (!match) throw new Error("Could not parse version from latest.yml");
    const latestVersion = match[1];

    // Step 3: construct feed URL pointing to the version folder
    const feedUrl = `https://${bucket}.s3.${region}.amazonaws.com/releases/${latestVersion}`;
    return feedUrl;
  } catch (err) {
    console.error("Error constructing feed URL:", err);
    throw err;
  }
}