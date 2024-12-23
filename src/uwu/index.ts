export function isProduction(): boolean {
    return import.meta.env.MODE === 'production';
  }

function yapping(a)
{
    if (!isProduction())
    {
        console.log(a);
    }
}
export  {yapping}