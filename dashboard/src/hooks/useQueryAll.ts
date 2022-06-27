import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";

interface QueryAllParams {
  uri: string;
  query: string;
  skipCount?: number;
  variables?: any;
  attrName: string;
}

export default function useQueryAll({ uri, query, skipCount = 100, variables, attrName }: QueryAllParams) {
  const client = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri,
      }),
      cache: new InMemoryCache(),
    });
  }, [uri]);

  const [data, setData] = useState<{
    [x: string]: any[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let hasNextPage = true;
        let allResults: any[] = [];

        for (let i = 0; hasNextPage; i++) {
          const { data } = await client.query({
            query: gql`
              ${query}
            `,
            variables: { ...variables, skipCount: skipCount * i },
          });

          allResults = [...allResults, ...data[attrName]];
          hasNextPage = !!data[attrName].length;
        }

        setData({ [attrName]: allResults });
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError(true);
      }
    })();
  }, [attrName, client, query, skipCount, variables]);

  return { data, loading, error };
}
