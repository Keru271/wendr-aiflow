import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerQuery = searchParams.get('owner')?.trim();
    const tokenQuery = searchParams.get('token')?.trim();

    const targetOwner = ownerQuery || process.env.GITHUB_OWNER || 'Keru271';
    const token = tokenQuery || process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      'User-Agent': 'FixPilot-RepoFetcher/1.0',
      Accept: 'application/vnd.github.v3+json'
    };

    if (token && !token.includes('mock') && !token.includes('dummy')) {
      headers.Authorization = `Bearer ${token}`;
    }

    let rawRepos: any[] = [];
    let fetchSource = '';

    // If an authenticated token was provided and user didn't specify a different owner,
    // fetch all repositories the user has access to
    if (token && !token.includes('mock') && !token.includes('dummy') && !ownerQuery) {
      try {
        const userReposRes = await fetch(
          'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
          { headers, cache: 'no-store' }
        );

        if (userReposRes.ok) {
          const data = await userReposRes.json();
          if (Array.isArray(data)) {
            rawRepos = data;
            fetchSource = 'authenticated_user';
          }
        }
      } catch (err) {
        console.warn('Failed to fetch via authenticated user/repos, falling back to public owner lookup:', err);
      }
    }

    // If not fetched yet or specific owner requested, query target user/org repos
    if (rawRepos.length === 0) {
      let res = await fetch(`https://api.github.com/users/${encodeURIComponent(targetOwner)}/repos?per_page=100&sort=updated`, {
        headers,
        cache: 'no-store'
      });

      if (!res.ok && res.status === 404) {
        // Try organization endpoint
        res = await fetch(`https://api.github.com/orgs/${encodeURIComponent(targetOwner)}/repos?per_page=100&sort=updated`, {
          headers,
          cache: 'no-store'
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          rawRepos = data;
          fetchSource = `user_or_org_${targetOwner}`;
        }
      } else {
        const errBody = await res.text();
        return NextResponse.json(
          {
            error: `GitHub API error (${res.status}): ${errBody}`,
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
      fullName: r.full_name || `${targetOwner}/${r.name}`,
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
      count: repositories.length,
      repositories
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

