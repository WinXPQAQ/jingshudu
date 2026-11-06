#include <bits/stdc++.h>
using namespace std;
using Board=array<int,81>;
array<array<int,9>,27> units;array<vector<int>,81> peers;bool sees[81][81];
int pc(int m){return __builtin_popcount((unsigned)m);}int digit(int m){return __builtin_ctz((unsigned)m);}
void init(){for(int i=0;i<81;i++){int r=i/9,c=i%9,b=r/3*3+c/3;units[r][c]=i;units[9+c][r]=i;units[18+b][r%3*3+c%3]=i;}for(int i=0;i<81;i++)for(int j=0;j<81;j++)if(i!=j&&(i/9==j/9||i%9==j%9||(i/27==j/27&&i%9/3==j%9/3))){peers[i].push_back(j);sees[i][j]=true;}}
int countSolutions(Board b,Board* answer=nullptr,int limit=2){int rows[9]={},cols[9]={},boxes[9]={};for(int i=0;i<81;i++)if(b[i]){int m=1<<b[i],r=i/9,c=i%9,k=i/27*3+i%9/3;if((rows[r]|cols[c]|boxes[k])&m)return 0;rows[r]|=m;cols[c]|=m;boxes[k]|=m;}
 function<int()> dfs=[&](){int at=-1,mask=0,best=10;for(int i=0;i<81;i++)if(!b[i]){int m=1022&~(rows[i/9]|cols[i%9]|boxes[i/27*3+i%9/3]),n=pc(m);if(!n)return 0;if(n<best){at=i;mask=m;best=n;if(n==1)break;}}if(at<0){if(answer)*answer=b;return 1;}int total=0,r=at/9,c=at%9,k=at/27*3+at%9/3;while(mask){int m=mask&-mask;mask-=m;b[at]=digit(m);rows[r]|=m;cols[c]|=m;boxes[k]|=m;total+=dfs();rows[r]^=m;cols[c]^=m;boxes[k]^=m;if(total>=limit)break;}b[at]=0;return min(total,limit);};return dfs();}
struct Logic{
 Board v,m;int highest=0,fish3=0;bool sound=true;const Board* solution=nullptr;
 Logic(Board b,const Board* s=nullptr):v(b),solution(s){for(int i=0;i<81;i++){m[i]=0;if(!v[i]){m[i]=1022;for(int j:peers[i])m[i]&=~(1<<v[j]);}}}
 bool finished()const{return all_of(v.begin(),v.end(),[](int n){return n!=0;});}
 bool valid()const{for(int i=0;i<81;i++){if(!v[i]&&!m[i])return false;if(v[i])for(int j:peers[i])if(v[j]==v[i])return false;}for(auto&u:units)for(int d=1;d<=9;d++){bool found=false;for(int i:u)if(v[i]==d||(m[i]&(1<<d)))found=true;if(!found)return false;}return true;}
 void put(int i,int d){if(solution&&(*solution)[i]!=d)sound=false;v[i]=d;m[i]=0;for(int j:peers[i])remove(j,1<<d);}
 bool remove(int i,int mask){int removed=m[i]&mask;if(!removed)return false;if(solution&&(removed&(1<<(*solution)[i])))sound=false;m[i]&=~mask;return true;}
 bool singles(){for(int i=0;i<81;i++)if(pc(m[i])==1){put(i,digit(m[i]));return true;}for(auto&u:units)for(int d=1;d<=9;d++){int at=-1,n=0;for(int i:u)if(m[i]&(1<<d)){n++;at=i;}if(n==1){put(at,d);return true;}}return false;}
 bool locked(){for(int a=0;a<27;a++)for(int d=1;d<=9;d++){vector<int>cs;for(int i:units[a])if(m[i]&(1<<d))cs.push_back(i);if(cs.size()<2)continue;for(int b=0;b<27;b++)if(a!=b){bool all=true;for(int i:cs)if(find(units[b].begin(),units[b].end(),i)==units[b].end()){all=false;break;}if(all){bool change=false;for(int i:units[b])if(find(units[a].begin(),units[a].end(),i)==units[a].end())change=remove(i,1<<d)||change;if(change)return true;}}}return false;}
 bool subset(int size,bool hidden){for(auto&u:units){for(int a=0;a<9;a++)for(int b=a+1;b<9;b++)for(int c=(size==2?9:b+1);c<(size==2?10:9);c++){
 int mask=0;vector<int>cells;
 if(hidden){mask=(1<<(a+1))|(1<<(b+1))|(size==3?1<<(c+1):0);bool present=true;for(int d=1;d<=9;d++)if(mask&(1<<d)){bool found=false;for(int i:u)if(m[i]&(1<<d))found=true;if(!found)present=false;}if(!present)continue;for(int i:u)if(m[i]&mask)cells.push_back(i);if((int)cells.size()!=size)continue;bool change=false;for(int i:cells)change=remove(i,1022&~mask)||change;if(change)return true;
 }else{cells={u[a],u[b]};if(size==3)cells.push_back(u[c]);bool ok=true;for(int i:cells){if(!m[i]||pc(m[i])>size)ok=false;mask|=m[i];}if(!ok||pc(mask)!=size)continue;bool change=false;for(int i:u)if(find(cells.begin(),cells.end(),i)==cells.end())change=remove(i,mask)||change;if(change)return true;}
 }}return false;}
 bool basic(){return singles()||locked()||subset(2,false)||subset(2,true);}
 bool propagate(){while(valid()&&!finished()){if(!basic())break;}return valid();}
 bool fish(int size){for(int tr=0;tr<2;tr++)for(int d=1;d<=9;d++){int pos[9]={};for(int r=0;r<9;r++)for(int c=0;c<9;c++)if(m[tr?c*9+r:r*9+c]&(1<<d))pos[r]|=1<<c;
 for(int a=0;a<9;a++)for(int b=a+1;b<9;b++)for(int c=(size==2?9:b+1);c<(size==2?10:9);c++){vector<int>rows={a,b};if(size==3)rows.push_back(c);int cols=0;bool ok=true;for(int r:rows){if(pc(pos[r])<2||pc(pos[r])>size)ok=false;cols|=pos[r];}if(!ok||pc(cols)!=size)continue;bool change=false;for(int r=0;r<9;r++)if(find(rows.begin(),rows.end(),r)==rows.end())for(int col=0;col<9;col++)if(cols&(1<<col))change=remove(tr?col*9+r:r*9+col,1<<d)||change;if(change)return true;}
 }return false;}
 bool chain(int low,int high){vector<int>biv;for(int i=0;i<81;i++)if(pc(m[i])==2)biv.push_back(i);int budget=60000;bool used[81]={};vector<int>path;
 for(int start:biv)for(int target=1;target<=9;target++)if(m[start]&(1<<target)){
 path={start};used[start]=true;function<bool(int,int)>walk=[&](int current,int forced){if(--budget<0)return false;if((int)path.size()>=low&&forced==target){bool change=false;for(int i:peers[start])if(sees[current][i]&&!used[i])change=remove(i,1<<target)||change;if(change)return true;}if((int)path.size()>=high)return false;for(int next:biv)if(!used[next]&&sees[current][next]&&(m[next]&(1<<forced))){used[next]=true;path.push_back(next);bool ok=walk(next,digit(m[next]&~(1<<forced)));path.pop_back();used[next]=false;if(ok)return true;if(budget<0)break;}return false;};bool ok=walk(start,digit(m[start]&~(1<<target)));used[start]=false;if(ok)return true;if(budget<0)return false;
 }return false;}
 int rate(){while(valid()&&!finished()){int t=-1;if(singles()||locked()||subset(2,false))t=0;else if(subset(2,true)||subset(3,false)||subset(3,true))t=1;else if(fish(2)||chain(3,3))t=2;else if(fish(3)){t=3;fish3++;}else if(chain(4,10))t=4;else return -1;highest=max(highest,t);}if(!valid()||!sound)return -1;return fish3>=2?4:highest;}
};
// Exhaustively consider EVERY bivalue cell at the basic fixed point. A known
// unique solution selects the successful DFS branch without wasting time on
// wrong subtrees. Thus depth 2 means a proven lower bound >=2, not exact depth.
int binaryFloor(Board puzzle,const Board& solution){Logic base(puzzle,&solution);if(!base.propagate()||!base.sound)throw runtime_error("unsound basic solver");if(base.finished())return 0;for(int i=0;i<81;i++)if(pc(base.m[i])==2){Logic next=base;next.put(i,solution[i]);if(!next.propagate()||!next.sound)throw runtime_error("unsound branch");if(next.finished())return 1;}return 2;}
string text(const Board&b){string s;for(int n:b)s+=char('0'+n);return s;}Board parse(string s){Board b{};for(int i=0;i<81;i++)b[i]=s[i]-'0';return b;}
string normalized(Board b){string best(81,'9');for(int t=0;t<8;t++){int map[10]={},next=0;string key;for(int i=0;i<81;i++){int r=i/9,c=i%9;if(t&1)swap(r,c);if(t&2)r=8-r;if(t&4)c=8-c;int n=b[r*9+c];if(n&&!map[n])map[n]=++next;key+=char('0'+map[n]);}best=min(best,key);}return best;}
Board fresh(mt19937&rng){Board b{};function<bool()>fill=[&](){int at=-1,mask=0,best=10;for(int i=0;i<81;i++)if(!b[i]){int m=1022;for(int j:peers[i])m&=~(1<<b[j]);int n=pc(m);if(!n)return false;if(n<best){at=i;mask=m;best=n;}}if(at<0)return true;vector<int>ds;for(int d=1;d<=9;d++)if(mask&(1<<d))ds.push_back(d);shuffle(ds.begin(),ds.end(),rng);for(int d:ds){b[at]=d;if(fill())return true;}b[at]=0;return false;};fill();return b;}
Board dig(Board b,mt19937&rng){vector<int>order(81);iota(order.begin(),order.end(),0);shuffle(order.begin(),order.end(),rng);for(int i:order)if(b[i]){int old=b[i];b[i]=0;if(countSolutions(b)!=1)b[i]=old;}return b;}
int main(int argc,char**argv){init();string mode=argc>1?argv[1]:"";
 if(mode=="audit"){string line;long count=0;int floors[3]={};while(cin>>line){Board b=parse(line),sol;int unique=countSolutions(b,&sol);Logic l(b,&sol);int tier=unique==1?l.rate():-1;int floor=unique==1?binaryFloor(b,sol):-1;cout<<line<<","<<unique<<","<<tier<<","<<floor<<"\n";count++;}return 0;}
 if(mode!="generate"||argc<6){cerr<<"generate target seed seed-directory output-directory\n";return 1;}
 int target=stoi(argv[2]);mt19937 rng(stoul(argv[3]));string seedDir=argv[4],out=argv[5];filesystem::create_directories(out);vector<Board>pool[5],accepted[5];set<string>seen;int counts[5]={};
 for(int d=0;d<5;d++){ifstream f(seedDir+"/"+to_string(d)+".txt");string s;while(f>>s)if(s.size()==81){Board b=parse(s),sol;pool[d].push_back(b);if(d>=3&&countSolutions(b,&sol)==1&&binaryFloor(b,sol)>=2)accepted[d].push_back(b);}}
 for(int d=3;d<5;d++){ifstream f(seedDir+"/extra"+to_string(d)+".txt");string s;while(f>>s)if(s.size()==81)accepted[d].push_back(parse(s));}
 ofstream outputs[5],metrics(out+"/ratings.csv");metrics<<"puzzle,logicTier,binaryFloor,finalTier\n";for(int d=0;d<5;d++)outputs[d].open(out+"/"+to_string(d)+".txt");
 long attempts=0;auto start=chrono::steady_clock::now();while(*min_element(counts,counts+5)<target){int scarce=min_element(counts,counts+5)-counts;Board b;attempts++;
 if(attempts%8&& !pool[scarce].empty()){auto &source=(!accepted[scarce].empty()&&rng()%10)?accepted[scarce]:pool[scarce];b=source[rng()%source.size()];Board sol;if(countSolutions(b,&sol)!=1)continue;vector<int>empty;for(int i=0;i<81;i++)if(!b[i])empty.push_back(i);shuffle(empty.begin(),empty.end(),rng);int add=1+rng()%4;for(int k=0;k<add&&k<(int)empty.size();k++)b[empty[k]]=sol[empty[k]];if(rng()%4==0)b=dig(b,rng);else{vector<int>filled;for(int i=0;i<81;i++)if(b[i])filled.push_back(i);shuffle(filled.begin(),filled.end(),rng);int removeCount=add+int(rng()%3);for(int k=0;k<removeCount&&k<(int)filled.size();k++){int i=filled[k],old=b[i];b[i]=0;if(countSolutions(b)!=1)b[i]=old;}}}else b=dig(fresh(rng),rng);
 string canonical=normalized(b);if(seen.count(canonical))continue;Board sol;if(countSolutions(b,&sol)!=1)throw runtime_error("nonunique generation");Logic l(b,&sol);int tier=l.rate();if(tier<0)continue;int floor=binaryFloor(b,sol);int finalTier=tier;if(floor==0)finalTier=min(tier,1);else if(floor==1)finalTier=min(tier,2);
 // Keep a reservoir of candidates even when demoted, so scarce high tiers can evolve.
 if(pool[tier].size()<20000&&rng()%3==0)pool[tier].push_back(b);
 if(counts[finalTier]<target){seen.insert(canonical);counts[finalTier]++;outputs[finalTier]<<text(b)<<"\n";outputs[finalTier].flush();metrics<<text(b)<<","<<tier<<","<<floor<<","<<finalTier<<"\n";metrics.flush();accepted[finalTier].push_back(b);}
 if(attempts%1000==0){cerr<<"attempts="<<attempts<<" counts=";for(int n:counts)cerr<<n<<",";cerr<<" seconds="<<chrono::duration_cast<chrono::seconds>(chrono::steady_clock::now()-start).count()<<endl;}
 }cerr<<"DONE attempts="<<attempts<<endl;
}
