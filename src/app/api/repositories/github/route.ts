import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerQuery = searchParams.get('owner')?.trim();
    const tokenQuery = searchParams.get('token')?.trim();

    const targetOwner = ownerQuery || process.env.GITHUB_OWNER || 'Keru271';
    // Use tokenQuery first; if not provided, try process.env.GITHUB_TOKEN
    const token = tokenQuery || process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      'User-Agent': 'FixPilot-RepoFetcher/1.0',
      Accept: 'application/vnd.github.v3+json'
    };

    let rawRepos: any[] = [];
    let fetchSource = '';
    let tokenWarning: string | null = null;
    let tokenValid = false;

    // 1. If a token is available, attempt to query authenticated repositories (returns PRIVATE + PUBLIC)
    if (token && !token.includes('mock') && !token.includes('dummy')) {
      try {
        const authedHeaders = {
          ...headers,
          Authorization: `Bearer ${token}`
        };

        const userReposRes = await fetch(
          'https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all&affiliation=owner,collaborator,organization_member',
          { headers: authedHeaders, cache: 'no-store' }
        );

        if (userReposRes.ok) {
          const data = await userReposRes.json();
          if (Array.isArray(data) && data.length > 0) {
            tokenValid = true;
            fetchSource = 'authenticated_token_all';
            // If user explicitly specified an owner, filter to that owner if any match,
            // otherwise include all repos accessible to this token
            const matchingOwner = data.filter(
              (r) => r.owner?.login?.toLowerCase() === targetOwner.toLowerCase()
            );

            if (matchingOwner.length > 0) {
              rawRepos = matchingOwner;
            } else {
              rawRepos = data;
            }
          }
        } else if (userReposRes.status === 401) {
          tokenWarning = 'The GitHub Token provided is invalid or expired (401 Bad credentials). Private repositories cannot be fetched without a valid token.';
        } else {
          const errText = await userReposRes.text();
          console.warn(`GitHub user/repos returned status ${userReposRes.status}:`, errText);
        }
      } catch (err: any) {
        console.warn('Error fetching authenticated repos:', err.message);
      }
    }

    // 2. If no repos yet (e.g. unauthenticated or token failed), fetch by username / organization
    if (rawRepos.length === 0) {
      const publicHeaders = { ...headers };
      if (token && !token.includes('mock') && !token.includes('dummy')) {
        publicHeaders.Authorization = `Bearer ${token}`;
      }

      // Try user endpoint
      let res = await fetch(`https://api.github.com/users/${encodeURIComponent(targetOwner)}/repos?per_page=100&sort=updated`, {
        headers: publicHeaders,
        cache: 'no-store'
      });

      if (!res.ok && (res.status === 404 || res.status === 403)) {
        // Try organization endpoint
        res = await fetch(`https://api.github.com/orgs/${encodeURIComponent(targetOwner)}/repos?per_page=100&sort=updated`, {
          headers: publicHeaders,
          cache: 'no-store'
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          rawRepos = data;
          fetchSource = `public_${targetOwner}`;
        }
      } else {
        const errBody = await res.text();
        return NextResponse.json(
          {
            error: `GitHub API error (${res.status}): ${errBody}`,
            warning: tokenWarning,
            owner: targetOwner,
            repositories: []
          },
          { status: res.status }
        );
      }
    }

    const repositories = rawRepos.map((r: any) => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name || `${r.owner?.login || targetOwner}/${r.name}`,
      owner: r.owner?.login || targetOwner,
      defaultBranch: r.default_branch || 'main',
      description: r.description || '',
      isPrivate: Boolean(r.private),
      cloneUrl: r.clone_url || `https://github.com/${r.owner?.login || targetOwner}/${r.name}.git`,
      htmlUrl: r.html_url || `https://github.com/${r.owner?.login || targetOwner}/${r.name}`,
      stars: r.stargazers_count || 0,
      updatedAt: r.updated_at
    }));

    return NextResponse.json({
      success: true,
      owner: targetOwner,
      source: fetchSource,
      tokenValid,
      tokenWarning,
      count: repositories.length,
      repositories
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
